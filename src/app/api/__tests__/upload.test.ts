import { POST } from "../upload/route";
import { NextRequest } from "next/server";
import { extractTextFromBuffer } from "../../utils/textExtract";
import { vectorDB } from "../../lib/vectordb";

jest.mock("../../utils/textExtract");
jest.mock("../../lib/vectordb");

describe("Upload API Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/upload", () => {
    it("should successfully upload a text file", async () => {
      const mockChunks = [
        { content: "chunk1", metadata: {} },
        { content: "chunk2", metadata: {} },
      ];
      (extractTextFromBuffer as jest.Mock).mockResolvedValue(mockChunks);
      (vectorDB.addDocuments as jest.Mock).mockResolvedValue(undefined);

      const formData = new FormData();
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("File uploaded and processed successfully");
      expect(data.filename).toBe("test.txt");
      expect(data.chunks).toBe(2);
      expect(data.timestamp).toBeDefined();
    });

    it("should successfully upload a markdown file", async () => {
      const mockChunks = [{ content: "markdown content", metadata: {} }];
      (extractTextFromBuffer as jest.Mock).mockResolvedValue(mockChunks);
      (vectorDB.addDocuments as jest.Mock).mockResolvedValue(undefined);

      const formData = new FormData();
      const file = new File(["# Markdown"], "test.md", {
        type: "text/markdown",
      });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filename).toBe("test.md");
    });

    it("should return 400 error when no file is provided", async () => {
      const formData = new FormData();

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No file provided");
    });

    it("should reject invalid file types", async () => {
      const formData = new FormData();
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid file type");
    });

    it("should reject files larger than 10MB", async () => {
      const formData = new FormData();
      const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
      const file = new File([largeContent], "large.txt", {
        type: "text/plain",
      });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("File size must be less than 10MB");
    });

    it("should handle extraction errors", async () => {
      (extractTextFromBuffer as jest.Mock).mockRejectedValue(
        new Error("Extraction failed")
      );

      const formData = new FormData();
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle database storage errors", async () => {
      const mockChunks = [{ content: "chunk", metadata: {} }];
      (extractTextFromBuffer as jest.Mock).mockResolvedValue(mockChunks);
      (vectorDB.addDocuments as jest.Mock).mockRejectedValue(
        new Error("Storage failed")
      );

      const formData = new FormData();
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});

