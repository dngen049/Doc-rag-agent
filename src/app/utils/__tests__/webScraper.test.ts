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
  processScrapedContent,
  scrapeUrl,
  scrapeUrls,
} from "../webScraper";

const globalAny = global as typeof global & { fetch?: jest.Mock };

beforeEach(() => {
  globalAny.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("scrapeUrl", () => {
  it("scrapes static HTML content and extracts metadata", async () => {
    const html = `
      <html>
        <head>
          <title>Static Page</title>
          <meta name="description" content="Simple description" />
          <meta name="author" content="Docs Bot" />
          <meta property="article:published_time" content="2024-05-01" />
        </head>
        <body>
          <header>Ignored header</header>
          <main>
            <h1>Heading</h1>
            <p>First paragraph.</p>
          </main>
          <a href="https://example.com/one">Keep</a>
          <a href="/relative">Skip</a>
        </body>
      </html>
    `;

    globalAny.fetch!.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const result = await scrapeUrl("https://example.com/page");

    expect(globalAny.fetch).toHaveBeenCalledWith(
      "https://example.com/page",
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result.title).toBe("Static Page");
    expect(result.content).toBe("Heading First paragraph.");
    expect(result.metadata).toMatchObject({
      description: "Simple description",
      author: "Docs Bot",
      publishedDate: "2024-05-01",
      links: ["https://example.com/one"],
    });
    expect(result.metadata.wordCount).toBe(3);
  });
});

describe("scrapeUrls", () => {
  it("fetches multiple URLs sequentially and aggregates results", async () => {
    const urls = [
      "https://example.com/a",
      "https://example.com/b",
    ];

    const htmlByUrl: Record<string, string> = {
      "https://example.com/a": "<html><body><main>Alpha content</main></body></html>",
      "https://example.com/b": "<html><body><main>Beta content</main></body></html>",
    };

    globalAny.fetch!.mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => htmlByUrl[url],
    }));

    jest.useFakeTimers();
    const scrapePromise = scrapeUrls(urls);
    jest.runAllTimers();
    const results = await scrapePromise;
    jest.useRealTimers();

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.url)).toEqual(urls);
    expect(globalAny.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("processScrapedContent", () => {
  it("chunks scraped content and decorates metadata", async () => {
    const scraped = [
      {
        url: "https://example.com/a",
        title: "Page A",
        content: "Alpha || Beta || Gamma",
        metadata: {
          description: "",
          author: "",
          publishedDate: "",
          wordCount: 3,
          links: [],
        },
      },
    ];

    const chunks = await processScrapedContent(scraped);

    expect(chunks).toHaveLength(3);
    expect(chunks[1]).toMatchObject({
      id: "https://example.com/a-chunk-1",
      content: "Beta",
      metadata: {
        url: "https://example.com/a",
        title: "Page A",
        chunkIndex: 1,
        source: "web",
      },
    });
    expect(chunks[1].metadata.scrapedAt).toBeDefined();
  });
});
