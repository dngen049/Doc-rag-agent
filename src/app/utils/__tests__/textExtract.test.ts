jest.mock("langchain/text_splitter");

import { extractTextFromFile, extractTextFromBuffer } from "../textExtract";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

describe("textExtract", () => {
  let mockSplitText: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSplitText = jest.fn();
    (RecursiveCharacterTextSplitter as jest.Mock).mockImplementation(() => ({
      splitText: mockSplitText,
    }));
  });

  describe("extractTextFromFile", () => {
    it("should extract text from a plain text file", async () => {
      const fileContent = "This is a test file content.";
      const file = new File([fileContent], "test.txt", { type: "text/plain" });
      mockSplitText.mockResolvedValue([fileContent]);

      const result = await extractTextFromFile(file, "test.txt");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].content).toBe(fileContent);
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
      expect(result[0].metadata.uploadedAt).toBeDefined();
    });

    it("should extract text from a markdown file", async () => {
      const fileContent = "# Markdown Title\n\nSome content.";
      const file = new File([fileContent], "test.md", {
        type: "text/markdown",
      });
      mockSplitText.mockResolvedValue([fileContent]);

      const result = await extractTextFromFile(file, "test.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(fileContent);
      expect(result[0].metadata.filename).toBe("test.md");
    });

    it("should extract text from a markdown file with x-markdown type", async () => {
      const fileContent = "# Markdown Title";
      const file = new File([fileContent], "test.md", {
        type: "text/x-markdown",
      });
      mockSplitText.mockResolvedValue([fileContent]);

      const result = await extractTextFromFile(file, "test.md");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(fileContent);
    });

    it("should handle multiple chunks", async () => {
      const fileContent = "Long text content";
      const file = new File([fileContent], "test.txt", { type: "text/plain" });
      mockSplitText.mockResolvedValue(["chunk1", "chunk2", "chunk3"]);

      const result = await extractTextFromFile(file, "test.txt");

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].content).toBe("chunk1");
      expect(result[1].id).toBe("test.txt-chunk-1");
      expect(result[1].content).toBe("chunk2");
      expect(result[2].id).toBe("test.txt-chunk-2");
      expect(result[2].content).toBe("chunk3");
    });

    it("should throw error for unsupported file type", async () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await expect(extractTextFromFile(file, "test.pdf")).rejects.toThrow(
        "Failed to extract text from test.pdf"
      );
    });

    it("should throw error with specific message for unsupported type", async () => {
      const file = new File(["content"], "test.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await expect(extractTextFromFile(file, "test.docx")).rejects.toThrow(
        "Failed to extract text from test.docx"
      );
    });
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text from a plain text buffer", async () => {
      const content = "Buffer content";
      const buffer = Buffer.from(content, "utf-8");
      mockSplitText.mockResolvedValue([content]);

      const result = await extractTextFromBuffer(buffer, "test.txt", "text/plain");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test.txt-chunk-0");
      expect(result[0].content).toBe(content);
      expect(result[0].metadata.filename).toBe("test.txt");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("test.txt");
      expect(result[0].metadata.uploadedAt).toBeDefined();
    });

    it("should extract text from a markdown buffer", async () => {
      const content = "# Markdown from buffer";
      const buffer = Buffer.from(content, "utf-8");
      mockSplitText.mockResolvedValue([content]);

      const result = await extractTextFromBuffer(buffer, "test.md", "text/markdown");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should extract text from a markdown buffer with x-markdown type", async () => {
      const content = "# Markdown";
      const buffer = Buffer.from(content, "utf-8");
      mockSplitText.mockResolvedValue([content]);

      const result = await extractTextFromBuffer(buffer, "test.md", "text/x-markdown");

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(content);
    });

    it("should handle multiple chunks from buffer", async () => {
      const content = "Long buffer content";
      const buffer = Buffer.from(content, "utf-8");
      mockSplitText.mockResolvedValue(["chunk1", "chunk2"]);

      const result = await extractTextFromBuffer(buffer, "test.txt", "text/plain");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("chunk1");
      expect(result[1].content).toBe("chunk2");
    });

    it("should throw error for unsupported buffer type", async () => {
      const buffer = Buffer.from("content", "utf-8");

      await expect(
        extractTextFromBuffer(buffer, "test.pdf", "application/pdf")
      ).rejects.toThrow("Failed to extract text from test.pdf");
    });
  });
});

