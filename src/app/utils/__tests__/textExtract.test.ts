import { extractTextFromFile, extractTextFromBuffer } from "../textExtract";

// Mock langchain text splitter
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockImplementation((text: string) => {
      // Simple mock: split by length for testing
      const chunkSize = 1000;
      const chunks = [];
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
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].content).toBe(content);
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
    });

    it("should extract text from a markdown file", async () => {
      const content = "# Markdown Title\n\nThis is markdown content.";
      const file = new File([content], "test.md", { type: "text/markdown" });

      const result = await extractTextFromFile(file, "test.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
      expect(result[0].metadata.filename).toBe("test.md");
    });

    it("should handle text/x-markdown mime type", async () => {
      const content = "# Another Markdown";
      const file = new File([content], "doc.md", { type: "text/x-markdown" });

      const result = await extractTextFromFile(file, "doc.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should split large text into multiple chunks", async () => {
      // Create a large text that will be split
      const largeContent = "a".repeat(2500);
      const file = new File([largeContent], "large.txt", { type: "text/plain" });

      const result = await extractTextFromFile(file, "large.txt");

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
      expect(result[0].id).toBe("large.txt-chunk-0");
      expect(result[1].id).toBe("large.txt-chunk-1");
    });

    it("should throw error for unsupported file types", async () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await expect(extractTextFromFile(file, "test.pdf")).rejects.toThrow(
        "Failed to extract text from test.pdf"
      );
    });

    it("should throw error for unsupported file types with descriptive message", async () => {
      const file = new File(["content"], "test.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await expect(extractTextFromFile(file, "test.docx")).rejects.toThrow(
        "Failed to extract text from test.docx"
      );
    });

    it("should include uploadedAt timestamp in metadata", async () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });

      const result = await extractTextFromFile(file, "test.txt");

      expect(result[0].metadata.uploadedAt).toBeDefined();
      expect(typeof result[0].metadata.uploadedAt).toBe("string");
      // Verify it's a valid ISO date string
      expect(new Date(result[0].metadata.uploadedAt).toISOString()).toBe(
        result[0].metadata.uploadedAt
      );
    });
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text from a plain text buffer", async () => {
      const content = "Buffer content here.";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "buffer.txt", "text/plain");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("buffer.txt-chunk-0");
      expect(result[0].content).toBe(content);
      expect(result[0].metadata.filename).toBe("buffer.txt");
      expect(result[0].metadata.source).toBe("buffer.txt");
    });

    it("should extract text from a markdown buffer", async () => {
      const content = "# Markdown from buffer";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "doc.md", "text/markdown");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should handle text/x-markdown mime type for buffers", async () => {
      const content = "Markdown content";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "file.md", "text/x-markdown");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should split large buffer content into chunks", async () => {
      const largeContent = "b".repeat(2500);
      const buffer = Buffer.from(largeContent, "utf-8");

      const result = await extractTextFromBuffer(buffer, "large.txt", "text/plain");

      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index);
        expect(chunk.id).toBe(`large.txt-chunk-${index}`);
      });
    });

    it("should throw error for unsupported buffer mime types", async () => {
      const buffer = Buffer.from("content", "utf-8");

      await expect(
        extractTextFromBuffer(buffer, "file.pdf", "application/pdf")
      ).rejects.toThrow("Failed to extract text from file.pdf");
    });

    it("should handle UTF-8 encoding correctly", async () => {
      const content = "Special chars: é, ñ, 中文, 🎉";
      const buffer = Buffer.from(content, "utf-8");

      const result = await extractTextFromBuffer(buffer, "unicode.txt", "text/plain");

      expect(result[0].content).toBe(content);
    });
  });
});
