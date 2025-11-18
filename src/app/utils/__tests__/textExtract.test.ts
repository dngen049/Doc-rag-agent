import {
  extractTextFromBuffer,
  extractTextFromFile,
} from "../textExtract"

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

afterAll(() => {
  consoleErrorSpy.mockRestore()
})

describe("extractTextFromFile", () => {
  it("extracts chunks and metadata from plain text files", async () => {
    const file = new File(["Simple content"], "sample.txt", {
      type: "text/plain",
    })

    const chunks = await extractTextFromFile(file, "sample.txt")

    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toContain("Simple content")
    expect(chunks[0].metadata.filename).toBe("sample.txt")
    expect(chunks[0].metadata.chunkIndex).toBe(0)
    expect(chunks[0].metadata.source).toBe("sample.txt")
    expect(chunks[0].metadata.uploadedAt).toBeDefined()
  })

  it("supports markdown files", async () => {
    const file = new File(["# Heading\nContent"], "doc.md", {
      type: "text/markdown",
    })

    const chunks = await extractTextFromFile(file, "doc.md")

    expect(chunks[0].content).toContain("Heading")
    expect(chunks[0].metadata.filename).toBe("doc.md")
  })

  it("throws for unsupported file types", async () => {
    const file = new File(["data"], "archive.zip", {
      type: "application/zip",
    })

    await expect(extractTextFromFile(file, "archive.zip")).rejects.toThrow(
      /Failed to extract text from archive.zip/
    )
  })
})

describe("extractTextFromBuffer", () => {
  it("converts buffers to chunks for plain text", async () => {
    const buffer = Buffer.from("Buffer content", "utf-8")

    const chunks = await extractTextFromBuffer(buffer, "buffer.txt", "text/plain")

    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe("Buffer content")
    expect(chunks[0].metadata.filename).toBe("buffer.txt")
    expect(chunks[0].metadata.source).toBe("buffer.txt")
  })

  it("throws for unsupported mime types", async () => {
    const buffer = Buffer.from("binary", "utf-8")

    await expect(
      extractTextFromBuffer(buffer, "file.bin", "application/octet-stream")
    ).rejects.toThrow(/Failed to extract text from file.bin/)
  })
})
