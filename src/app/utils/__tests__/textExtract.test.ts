jest.mock("langchain/text_splitter", () => {
  const splitText = jest.fn(async (text: string) =>
    text
      .split("||")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
  );

  return {
    RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
      splitText,
    })),
  };
});

import {
  extractTextFromBuffer,
  extractTextFromFile,
} from "../textExtract";

const fixedDate = new Date("2024-05-20T12:00:00.000Z");

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(fixedDate);
});

afterAll(() => {
  jest.useRealTimers();
});

describe("extractTextFromFile", () => {
  it("splits supported text files into structured chunks", async () => {
    const mockFile = {
      type: "text/plain",
      name: "notes.txt",
      text: jest.fn().mockResolvedValue("Intro || Details"),
    } as unknown as File;

    const chunks = await extractTextFromFile(mockFile, "notes.txt");

    expect(mockFile.text).toHaveBeenCalled();
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({
      id: "notes.txt-chunk-0",
      content: "Intro",
      metadata: {
        filename: "notes.txt",
        chunkIndex: 0,
        source: "notes.txt",
        uploadedAt: fixedDate.toISOString(),
      },
    });
  });
});

describe("extractTextFromBuffer", () => {
  it("handles markdown buffers and preserves metadata", async () => {
    const buffer = Buffer.from("Section A || Section B", "utf-8");

    const chunks = await extractTextFromBuffer(
      buffer,
      "doc.md",
      "text/markdown"
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[1].content).toBe("Section B");
    expect(chunks[1].metadata).toMatchObject({
      filename: "doc.md",
      chunkIndex: 1,
      source: "doc.md",
    });
    expect((chunks[1].metadata as any).uploadedAt).toBe(
      fixedDate.toISOString()
    );
  });

  it("throws a descriptive error for unsupported mime types", async () => {
    const buffer = Buffer.from("Binary data", "utf-8");
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      extractTextFromBuffer(buffer, "archive.zip", "application/zip")
    ).rejects.toThrow("Failed to extract text from archive.zip");

    consoleSpy.mockRestore();
  });
});
