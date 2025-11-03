import { GET } from "../files/route";
import { DELETE } from "../files/[filename]/route";
import { NextRequest } from "next/server";
import { vectorDB } from "../../lib/vectordb";

jest.mock("../../lib/vectordb");

describe("Files API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/files", () => {
    it("should return list of uploaded files", async () => {
      const mockFiles = [
        { name: "file1.txt", size: 1024 },
        { name: "file2.md", size: 2048 },
      ];
      (vectorDB.getUploadedFiles as jest.Mock).mockResolvedValue(mockFiles);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.files).toEqual(mockFiles);
      expect(data.count).toBe(2);
    });

    it("should return empty list when no files exist", async () => {
      (vectorDB.getUploadedFiles as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.files).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("should handle vectorDB errors", async () => {
      (vectorDB.getUploadedFiles as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch uploaded files");
    });
  });

  describe("DELETE /api/files/[filename]", () => {
    it("should successfully delete a file", async () => {
      (vectorDB.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/files/test.txt",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: { filename: "test.txt" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("deleted successfully");
      expect(data.filename).toBe("test.txt");
      expect(vectorDB.deleteDocument).toHaveBeenCalledWith("test.txt");
    });

    it("should handle URL-encoded filenames", async () => {
      (vectorDB.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/files/test%20file.txt",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: { filename: "test%20file.txt" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filename).toBe("test file.txt");
      expect(vectorDB.deleteDocument).toHaveBeenCalledWith("test file.txt");
    });

    it("should return 400 error when filename is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/files/",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: { filename: "" },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Filename is required");
    });

    it("should handle deletion errors", async () => {
      (vectorDB.deleteDocument as jest.Mock).mockRejectedValue(
        new Error("Deletion failed")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/files/test.txt",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: { filename: "test.txt" },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete file");
    });
  });
});

