const mockPage = {
  setUserAgent: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn(),
  title: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

const mockLaunch = jest.fn(async () => mockBrowser);

jest.mock("puppeteer", () => ({
  __esModule: true,
  default: { launch: mockLaunch },
  launch: mockLaunch,
}));

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

import * as webScraper from "@/app/utils/webScraper";

const originalFetch = globalThis.fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("web scraping utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scrapeUrl parses static HTML content via fetch", async () => {
    const html = `
      <html>
        <head>
          <title>Sample Page</title>
          <meta name="description" content="Sample description" />
          <meta name="author" content="Ada Lovelace" />
          <meta property="article:published_time" content="2024-01-01" />
        </head>
        <body>
          <main>
            <p>Hello world.</p>
            <a href="https://example.com/docs">Docs</a>
            <a href="/relative/link">Skip me</a>
          </main>
        </body>
      </html>
    `;

    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue(html),
    };
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse as unknown as Response
    );

    const result = await webScraper.scrapeUrl("https://example.com");

    expect(result.title).toBe("Sample Page");
    expect(result.content).toBe("Hello world.");
    expect(result.metadata).toEqual(
      expect.objectContaining({
        description: "Sample description",
        author: "Ada Lovelace",
        publishedDate: "2024-01-01",
        links: ["https://example.com/docs"],
        wordCount: 2,
      })
    );
    expect(mockLaunch).not.toHaveBeenCalled();
  });

  it("scrapeUrls processes multiple URLs sequentially", async () => {
    const urls = ["https://example.com/a", "https://example.com/b"];
    const scrapeSpy = jest
      .spyOn(webScraper, "scrapeUrl")
      .mockImplementation(async (url) => ({
        url,
        title: `Title for ${url}`,
        content: "Segment one\nSegment two",
        metadata: {
          description: "",
          author: "",
          publishedDate: "",
          wordCount: 4,
          links: [],
        },
      }));

    const timeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation(((cb: (...args: unknown[]) => void) => {
        cb();
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setTimeout);

    const results = await webScraper.scrapeUrls(urls);

    expect(scrapeSpy).toHaveBeenCalledTimes(2);
    expect(results.map((r) => r.url)).toEqual(urls);

    timeoutSpy.mockRestore();
    scrapeSpy.mockRestore();
  });

  it("processScrapedContent chunks scraped text with metadata", async () => {
    const scrapedContents: webScraper.ScrapedContent[] = [
      {
        url: "https://example.com/post",
        title: "Example Post",
        content: "Intro\nBody",
        metadata: {
          description: "desc",
          author: "author",
          publishedDate: "2024-01-01",
          wordCount: 2,
          links: [],
        },
      },
    ];

    const chunks = await webScraper.processScrapedContent(scrapedContents);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        id: "https://example.com/post-chunk-0",
        content: "Intro",
        metadata: expect.objectContaining({
          url: "https://example.com/post",
          title: "Example Post",
          chunkIndex: 0,
          source: "web",
          scrapedAt: expect.any(String),
        }),
      })
    );
  });
});
