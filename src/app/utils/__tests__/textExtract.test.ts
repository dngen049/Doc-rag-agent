// Mock langchain text splitter
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockImplementation(async (text: string) => {
      // Simple mock implementation that splits text into chunks
      const chunkSize = 1000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return chunks.length > 0 ? chunks : [text];
    }),
  })),
}));

import { extractTextFromFile, extractTextFromBuffer } from "../textExtract";

describe("textExtract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractTextFromFile", () => {
    it("should extract text from a plain text file", async () => {
      const mockText = "This is a test file content.";
      const mockFile = new File([mockText], "test.txt", { type: "text/plain" });

      const result = await extractTextFromFile(mockFile, "test.txt");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content).toBe(mockText);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
    });

    it("should extract text from a markdown file", async () => {
      const mockText = "# Heading\n\nThis is markdown content.";
      const mockFile = new File([mockText], "test.md", { type: "text/markdown" });

      const result = await extractTextFromFile(mockFile, "test.md");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content).toBe(mockText);
      expect(result[0].metadata.filename).toBe("test.md");
    });

    it("should handle text/x-markdown mime type", async () => {
      const mockText = "# Another markdown file";
      const mockFile = new File([mockText], "test.md", { type: "text/x-markdown" });

      const result = await extractTextFromFile(mockFile, "test.md");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content).toBe(mockText);
    });

    it("should throw error for unsupported file types", async () => {
      const mockFile = new File(["content"], "test.pdf", { type: "application/pdf" });

      await expect(extractTextFromFile(mockFile, "test.pdf")).rejects.toThrow(
        "Failed to extract text from test.pdf"
      );
    });

    it("should split large text into multiple chunks", async () => {
      const largeText = "a".repeat(2500); // Text larger than chunk size
      const mockFile = new File([largeText], "large.txt", { type: "text/plain" });

      const result = await extractTextFromFile(mockFile, "large.txt");

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
      expect(result[0].id).toBe("large.txt-chunk-0");
      expect(result[1].id).toBe("large.txt-chunk-1");
    });

    it("should include uploadedAt timestamp in metadata", async () => {
      const mockFile = new File(["test"], "test.txt", { type: "text/plain" });

      const result = await extractTextFromFile(mockFile, "test.txt");

      expect(result[0].metadata).toHaveProperty("uploadedAt");
      expect(typeof result[0].metadata.uploadedAt).toBe("string");
      // Verify it's a valid ISO date string
      expect(new Date(result[0].metadata.uploadedAt).toISOString()).toBe(
        result[0].metadata.uploadedAt
      );
    });
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text from a plain text buffer", async () => {
      const mockText = "Buffer content";
      const buffer = Buffer.from(mockText, "utf-8");

      const result = await extractTextFromBuffer(buffer, "test.txt", "text/plain");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].content).toBe(mockText);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.source).toBe("test.txt");
    });

    it("should extract text from a markdown buffer", async () => {
      const mockText = "# Markdown from buffer";
      const buffer = Buffer.from(mockText, "utf-8");

      const result = await extractTextFromBuffer(buffer, "test.md", "text/markdown");

      expect(result).toBeDefined();
      expect(result[0].content).toBe(mockText);
    });

    it("should handle text/x-markdown mime type for buffers", async () => {
      const mockText = "# X-Markdown content";
      const buffer = Buffer.from(mockText, "utf-8");

      const result = await extractTextFromBuffer(buffer, "test.md", "text/x-markdown");

      expect(result).toBeDefined();
      expect(result[0].content).toBe(mockText);
    });

    it("should throw error for unsupported mime types", async () => {
      const buffer = Buffer.from("content", "utf-8");

      await expect(
        extractTextFromBuffer(buffer, "test.pdf", "application/pdf")
      ).rejects.toThrow("Failed to extract text from test.pdf");
    });

    it("should handle UTF-8 encoding correctly", async () => {
      const mockText = "Hello 世界 🌍";
      const buffer = Buffer.from(mockText, "utf-8");

      const result = await extractTextFromBuffer(buffer, "unicode.txt", "text/plain");

      expect(result[0].content).toBe(mockText);
    });

    it("should split large buffer content into chunks", async () => {
      const largeText = "b".repeat(2500);
      const buffer = Buffer.from(largeText, "utf-8");

      const result = await extractTextFromBuffer(buffer, "large.txt", "text/plain");

      expect(result.length).toBeGreaterThan(1);
    });
  });
});

