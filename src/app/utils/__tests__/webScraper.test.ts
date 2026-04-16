import { scrapeUrl, scrapeUrls, processScrapedContent } from "../webScraper"

describe("scrapeUrl", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch
    }
  })

  it("scrapes static pages with metadata", async () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="A test page" />
          <meta name="author" content="Tester" />
          <meta property="article:published_time" content="2024-01-01" />
        </head>
        <body>
          <main>
            <h1>Main heading</h1>
            <p>Hello world content from the page.</p>
            <a href="http://example.com/link">Link</a>
          </main>
        </body>
      </html>
    `

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    }) as unknown as typeof fetch

    const result = await scrapeUrl("http://example.com")

    expect(result.title).toBe("Test Page")
    expect(result.content).toContain("Hello world content")
    expect(result.metadata.description).toBe("A test page")
    expect(result.metadata.author).toBe("Tester")
    expect(result.metadata.publishedDate).toBe("2024-01-01")
    expect(result.metadata.links).toContain("http://example.com/link")
    expect(result.metadata.wordCount).toBeGreaterThan(0)
  })
})

describe("scrapeUrls", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    jest.useRealTimers()
    if (originalFetch) {
      global.fetch = originalFetch
    }
  })

  it("processes multiple urls sequentially", async () => {
    jest.useFakeTimers()

    const html = `
      <html>
        <head><title>List Page</title></head>
        <body><main><p>List content</p></main></body>
      </html>
    `

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    }) as unknown as typeof fetch

    const promise = scrapeUrls(["http://one.test", "http://two.test"])
    await jest.runAllTimersAsync()
    const results = await promise

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
    expect(results[0].title).toBe("List Page")
  })
})

describe("processScrapedContent", () => {
  it("splits scraped content into chunks with metadata", async () => {
    const scraped = [
      {
        url: "http://example.com",
        title: "Example",
        content: "a".repeat(1200),
        metadata: { description: "", author: "", publishedDate: "", wordCount: 200, links: [] },
      },
    ]

    const chunks = await processScrapedContent(scraped)

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].id).toBe("http://example.com-chunk-0")
    expect(chunks[0].metadata.url).toBe("http://example.com")
    expect(chunks[0].metadata.title).toBe("Example")
    expect(chunks[0].metadata.source).toBe("web")
    expect(chunks[0].metadata.scrapedAt).toBeDefined()
  })
})
