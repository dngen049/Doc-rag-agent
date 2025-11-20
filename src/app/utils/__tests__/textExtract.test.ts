import {
  extractTextFromBuffer,
  extractTextFromFile,
} from "@/app/utils/textExtract"

const mockSplitText = jest.fn(async (text: string) => text.split("||"))

jest.mock("langchain/text_splitter", () => {
  return {
    RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
      splitText: (text: string) => mockSplitText(text),
    })),
  }
})

describe("text extraction utilities", () => {
  beforeEach(() => {
    mockSplitText.mockClear()
  })

  it("extracts and chunks text content from supported File uploads", async () => {
    const mockFile = {
      type: "text/plain",
      name: "notes.txt",
      text: jest.fn().mockResolvedValue("First chunk||Second chunk"),
    } as unknown as File

    const chunks = await extractTextFromFile(mockFile, "notes")

    expect(mockFile.text).toHaveBeenCalled()
    expect(mockSplitText).toHaveBeenCalledWith("First chunk||Second chunk")
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toMatchObject({
      id: "notes-chunk-0",
      content: "First chunk",
      metadata: {
        filename: "notes",
        chunkIndex: 0,
        source: "notes.txt",
      },
    })
    expect(chunks[1].metadata.source).toBe("notes.txt")
    expect(chunks[0].metadata.uploadedAt).toBeTruthy()
  })

  it("supports buffers for server-side ingestion", async () => {
    const buffer = Buffer.from("Buffer chunk one||Buffer chunk two", "utf-8")

    const chunks = await extractTextFromBuffer(buffer, "buffer.md", "text/markdown")

    expect(mockSplitText).toHaveBeenCalledWith(
      "Buffer chunk one||Buffer chunk two"
    )
    expect(chunks).toEqual([
      expect.objectContaining({
        id: "buffer.md-chunk-0",
        content: "Buffer chunk one",
        metadata: expect.objectContaining({
          filename: "buffer.md",
          source: "buffer.md",
        }),
      }),
      expect.objectContaining({
        id: "buffer.md-chunk-1",
        content: "Buffer chunk two",
      }),
    ])
  })

  it("rejects unsupported file types with a helpful error", async () => {
    const mockFile = {
      type: "application/pdf",
      name: "unsupported.pdf",
      text: jest.fn(),
    } as unknown as File

    await expect(extractTextFromFile(mockFile, "unsupported")).rejects.toThrow(
      "Failed to extract text from unsupported"
    )
  })
})
