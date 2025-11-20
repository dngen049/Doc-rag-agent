jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest
      .fn()
      .mockImplementation(async (text: string) =>
        text
          .split(/\n+/)
          .map((chunk) => chunk.trim())
          .filter(Boolean)
      ),
  })),
}));

import {
  extractTextFromBuffer,
  extractTextFromFile,
} from "@/app/utils/textExtract";

class MockFile extends Blob {
  readonly name: string;
  readonly lastModified: number;
  readonly type: string;

  constructor(
    chunks: BlobPart[],
    name: string,
    options?: BlobPropertyBag & { lastModified?: number }
  ) {
    super(chunks, options);
    this.name = name;
    this.type = options?.type ?? "";
    this.lastModified = options?.lastModified ?? Date.now();
  }
}

describe("text extraction utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts chunks and metadata from supported plain text files", async () => {
    const file = new MockFile(
      ["First chunk\nSecond chunk"],
      "notes.txt",
      { type: "text/plain" }
    );

    const chunks = await extractTextFromFile(
      file as unknown as File,
      "document.txt"
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        id: "document.txt-chunk-0",
        content: "First chunk",
        metadata: expect.objectContaining({
          filename: "document.txt",
          chunkIndex: 0,
          source: "notes.txt",
          uploadedAt: expect.any(String),
        }),
      })
    );
  });

  it("rejects unsupported file types with a clear error", async () => {
    const file = new MockFile(["binary"], "report.pdf", {
      type: "application/pdf",
    });
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      extractTextFromFile(file as unknown as File, "report.pdf")
    ).rejects.toThrow("Failed to extract text from report.pdf");

    consoleSpy.mockRestore();
  });

  it("extracts chunks from markdown buffers", async () => {
    const buffer = Buffer.from("Intro section\nDetails section", "utf-8");

    const chunks = await extractTextFromBuffer(
      buffer,
      "guide.md",
      "text/markdown"
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[1]).toEqual(
      expect.objectContaining({
        id: "guide.md-chunk-1",
        content: "Details section",
        metadata: expect.objectContaining({
          filename: "guide.md",
          source: "guide.md",
          chunkIndex: 1,
          uploadedAt: expect.any(String),
        }),
      })
    );
  });

  it("rejects unsupported buffer mime types", async () => {
    const buffer = Buffer.from("binary content", "utf-8");
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      extractTextFromBuffer(buffer, "archive.zip", "application/zip")
    ).rejects.toThrow("Failed to extract text from archive.zip");

    consoleSpy.mockRestore();
  });
});
