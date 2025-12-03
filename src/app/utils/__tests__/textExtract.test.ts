import {
  extractTextFromFile,
  extractTextFromBuffer,
} from "../textExtract";

// Mock the RecursiveCharacterTextSplitter
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn((text: string) => {
      // Simple mock implementation that splits by length
      const chunkSize = 1000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return Promise.resolve(chunks.length > 0 ? chunks : [text]);
    }),
  })),
}));

describe("textExtract", () => {
  describe("extractTextFromFile", () => {
    it("should extract text from a plain text file", async () => {
      const content = "This is a test file content.";
      const file = new File([content], "test.txt", { type: "text/plain" });

      const result = await extractTextFromFile(file, "test.txt");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
      expect(result[0].metadata.uploadedAt).toBeDefined();
    });

    it("should extract text from a markdown file", async () => {
      const content = "# Markdown Title\n\nThis is markdown content.";
      const file = new File([content], "test.md", { type: "text/markdown" });

      const result = await extractTextFromFile(file, "test.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
      expect(result[0].metadata.filename).toBe("test.md");
    });

    it("should extract text from a markdown file with x-markdown type", async () => {
      const content = "# Markdown Title";
      const file = new File([content], "test.md", { type: "text/x-markdown" });

      const result = await extractTextFromFile(file, "test.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should throw error for unsupported file type", async () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await expect(extractTextFromFile(file, "test.pdf")).rejects.toThrow(
        "Failed to extract text from test.pdf"
      );
    });

    it("should split large text into multiple chunks", async () => {
      // Create a large text that will be split into chunks
      const largeContent = "a".repeat(2500);
      const file = new File([largeContent], "large.txt", {
        type: "text/plain",
      });

      const result = await extractTextFromFile(file, "large.txt");

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
    });

    it("should generate unique IDs for each chunk", async () => {
      const largeContent = "a".repeat(2500);
      const file = new File([largeContent], "test.txt", {
        type: "text/plain",
      });

      const result = await extractTextFromFile(file, "test.txt");

      const ids = result.map((chunk) => chunk.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text from a plain text buffer", async () => {
      const content = "This is buffer content.";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "test.txt", "text/plain");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
      expect(result[0].metadata.uploadedAt).toBeDefined();
    });

    it("should extract text from a markdown buffer", async () => {
      const content = "# Markdown from buffer";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(
        buffer,
        "test.md",
        "text/markdown"
      );

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should extract text from a markdown buffer with x-markdown type", async () => {
      const content = "# Markdown content";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(
        buffer,
        "test.md",
        "text/x-markdown"
      );

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should throw error for unsupported mime type", async () => {
      const buffer = Buffer.from("content", "utf-8");

      await expect(
        extractTextFromBuffer(buffer, "test.pdf", "application/pdf")
      ).rejects.toThrow("Failed to extract text from test.pdf");
    });

    it("should handle UTF-8 encoded content correctly", async () => {
      const content = "Hello 世界 🌍";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "test.txt", "text/plain");

      expect(result[0].content).toBe(content);
    });

    it("should split large buffer content into multiple chunks", async () => {
      const largeContent = "b".repeat(2500);
      const buffer = Buffer.from(largeContent, "utf-8");

      const result = await extractTextFromBuffer(
        buffer,
        "large.txt",
        "text/plain"
      );

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
    });

    it("should handle empty buffer", async () => {
      const buffer = Buffer.from("", "utf-8");

      const result = await extractTextFromBuffer(buffer, "empty.txt", "text/plain");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("");
    });

    it("should preserve metadata across chunks", async () => {
      const largeContent = "c".repeat(2500);
      const buffer = Buffer.from(largeContent, "utf-8");

      const result = await extractTextFromBuffer(
        buffer,
        "test.txt",
        "text/plain"
      );

      result.forEach((chunk, index) => {
        expect(chunk.metadata.filename).toBe("test.txt");
        expect(chunk.metadata.source).toBe("test.txt");
        expect(chunk.metadata.chunkIndex).toBe(index);
      });
    });
  });
});

