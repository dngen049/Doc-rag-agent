import { POST } from "../chat/route";
import { NextRequest } from "next/server";
import { langChainService } from "../../lib/langchain";

jest.mock("../../lib/langchain");

describe("Chat API Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/chat", () => {
    it("should return a successful response with valid message", async () => {
      const mockResponse = "This is a test response";
      (langChainService.chatWithRAG as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What is this document about?",
          selectedDocuments: ["doc1"],
          multiSelectMode: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe(mockResponse);
      expect(data.timestamp).toBeDefined();
      expect(langChainService.chatWithRAG).toHaveBeenCalledWith(
        "What is this document about?",
        ["doc1"],
        false
      );
    });

    it("should return 400 error when message is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          selectedDocuments: ["doc1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Message is required and must be a string");
    });

    it("should return 400 error when message is not a string", async () => {
      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: 123,
          selectedDocuments: ["doc1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Message is required and must be a string");
    });

    it("should handle langChainService errors", async () => {
      (langChainService.chatWithRAG as jest.Mock).mockRejectedValue(
        new Error("Service error")
      );

      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What is this?",
          selectedDocuments: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle empty message string", async () => {
      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "",
          selectedDocuments: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Message is required and must be a string");
    });

    it("should pass multiSelectMode correctly", async () => {
      const mockResponse = "Response with multi-select";
      (langChainService.chatWithRAG as jest.Mock).mockResolvedValue(
        mockResponse
      );

      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Query",
          selectedDocuments: ["doc1", "doc2"],
          multiSelectMode: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(langChainService.chatWithRAG).toHaveBeenCalledWith(
        "Query",
        ["doc1", "doc2"],
        true
      );
    });
  });
});

