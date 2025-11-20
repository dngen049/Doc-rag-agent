import * as webScraper from "@/app/utils/webScraper"

const mockSplitText = jest.fn(async (text: string) => text.split("||"))

jest.mock("langchain/text_splitter", () => {
  return {
    RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
      splitText: (text: string) => mockSplitText(text),
    })),
  }
})

describe("webScraper helpers", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockSplitText.mockClear()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  describe("scrapeUrl", () => {
    it("parses static HTML responses without resorting to puppeteer", async () => {
      const html = `
        <html>
          <head>
            <title>Static Example</title>
            <meta name="description" content="Test description" />
            <meta name="author" content="Docs Bot" />
            <meta property="article:published_time" content="2024-01-01" />
          </head>
          <body>
            <main>
              <p>Primary content paragraph.</p>
              <p>Second paragraph for counting.</p>
            </main>
            <a href="https://example.com/about">About</a>
            <a href="/relative">Relative link</a>
          </body>
        </html>
      `

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      } as Response)

      const result = await webScraper.scrapeUrl("https://example.com")

      expect(result.title).toBe("Static Example")
      expect(result.content).toContain("Primary content paragraph.")
      expect(result.metadata.description).toBe("Test description")
      expect(result.metadata.author).toBe("Docs Bot")
      expect(result.metadata.links).toEqual(["https://example.com/about"])
      expect(result.metadata.wordCount).toBeGreaterThan(0)
    })
  })

  describe("scrapeUrls", () => {
    it("scrapes multiple URLs sequentially while continuing on success", async () => {
      const scrapeSpy = jest
        .spyOn(webScraper, "scrapeUrl")
        .mockResolvedValueOnce({
          url: "https://one.example",
          title: "One",
          content: "Chunk||Data",
          metadata: { wordCount: 2, links: [] },
        })
        .mockResolvedValueOnce({
          url: "https://two.example",
          title: "Two",
          content: "More||Content",
          metadata: { wordCount: 2, links: [] },
        })

      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation(((cb: (...args: unknown[]) => void) => {
          cb()
          return {} as NodeJS.Timeout
        }) as typeof setTimeout)

      const results = await webScraper.scrapeUrls([
        "https://one.example",
        "https://two.example",
      ])

      expect(scrapeSpy).toHaveBeenCalledTimes(2)
      expect(results.map((r) => r.title)).toEqual(["One", "Two"])

      setTimeoutSpy.mockRestore()
      scrapeSpy.mockRestore()
    })
  })

  describe("processScrapedContent", () => {
    it("chunks scraped pages with metadata for downstream ingestion", async () => {
      const chunks = await webScraper.processScrapedContent([
        {
          url: "https://example.com/a",
          title: "Page A",
          content: "A1||A2",
          metadata: { wordCount: 4, links: [] },
        },
      ])

      expect(mockSplitText).toHaveBeenCalledWith("A1||A2")
      expect(chunks).toEqual([
        expect.objectContaining({
          id: "https://example.com/a-chunk-0",
          content: "A1",
          metadata: expect.objectContaining({
            url: "https://example.com/a",
            title: "Page A",
            chunkIndex: 0,
            source: "web",
          }),
        }),
        expect.objectContaining({
          id: "https://example.com/a-chunk-1",
          content: "A2",
        }),
      ])
      expect(chunks[0].metadata.scrapedAt).toBeTruthy()
    })
  })
})
