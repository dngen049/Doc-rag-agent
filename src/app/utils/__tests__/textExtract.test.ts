import { File } from "buffer";
import {
  extractTextFromBuffer,
  extractTextFromFile,
} from "@/app/utils/textExtract";

const mockSplitText = jest.fn(async (text: string) => text.split("\n\n"));

jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: mockSplitText,
  })),
}));

describe("textExtract utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("splits supported text files into ordered chunks with metadata", async () => {
    const file = new File(
      ["Heading\n\nDetailed explanation"],
      "notes.txt",
      {
        type: "text/plain",
      }
    );

    const chunks = await extractTextFromFile(file, "notes");

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      id: "notes-chunk-0",
      content: "Heading",
      metadata: {
        filename: "notes",
        chunkIndex: 0,
        source: "notes.txt",
      },
    });
    expect(chunks[1]).toMatchObject({
      id: "notes-chunk-1",
      content: "Detailed explanation",
      metadata: {
        filename: "notes",
        chunkIndex: 1,
        source: "notes.txt",
      },
    });
    expect((chunks[0].metadata as any).uploadedAt).toEqual(expect.any(String));
  });

  it("processes markdown buffers and preserves file level metadata", async () => {
    const buffer = Buffer.from("Intro\n\nFollow up", "utf-8");

    const chunks = await extractTextFromBuffer(
      buffer,
      "article.md",
      "text/markdown"
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      id: "article.md-chunk-0",
      content: "Intro",
      metadata: {
        filename: "article.md",
        chunkIndex: 0,
        source: "article.md",
      },
    });
    expect(chunks[1]).toMatchObject({
      id: "article.md-chunk-1",
      content: "Follow up",
      metadata: {
        filename: "article.md",
        chunkIndex: 1,
        source: "article.md",
      },
    });
  });

  it("rejects unsupported file inputs with a helpful error", async () => {
    const pdf = new File(["binary"], "report.pdf", {
      type: "application/pdf",
    });

    await expect(extractTextFromFile(pdf, "report.pdf")).rejects.toThrow(
      "Failed to extract text from report.pdf"
    );
  });
});
