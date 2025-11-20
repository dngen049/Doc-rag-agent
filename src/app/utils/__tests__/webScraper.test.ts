import type { ScrapedContent } from "@/app/utils/webScraper";
import * as webScraper from "@/app/utils/webScraper";

const mockSplitText = jest.fn(async (text: string) => text.split("\n\n"));

jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: mockSplitText,
  })),
}));

const originalFetch = global.fetch;

describe("webScraper utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  describe("scrapeUrl", () => {
    it("scrapes static pages with metadata when fetch succeeds", async () => {
      const html = `
        <html>
          <head>
            <title>Sample Article</title>
            <meta name="description" content="Short summary" />
            <meta name="author" content="Ada Lovelace" />
            <meta property="article:published_time" content="2024-01-01" />
          </head>
          <body>
            <main>
              <h1>Heading</h1>
              <p>First paragraph.</p>
              <a href="https://example.com/extra">Read more</a>
              <a href="/relative">Ignore this</a>
            </main>
            <script>console.log("noise")</script>
          </body>
        </html>
      `;

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await webScraper.scrapeUrl("https://example.com/article");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.title).toBe("Sample Article");
      expect(result.content).toContain("Heading");
      expect(result.content).toContain("First paragraph.");
      expect(result.metadata.description).toBe("Short summary");
      expect(result.metadata.author).toBe("Ada Lovelace");
      expect(result.metadata.publishedDate).toBe("2024-01-01");
      expect(result.metadata.links).toEqual(["https://example.com/extra"]);
      expect(result.metadata.wordCount).toBeGreaterThan(3);
    });
  });

  describe("scrapeUrls", () => {
    it("scrapes multiple urls sequentially and returns their content", async () => {
      const urls = ["https://example.com/a", "https://example.com/b"];
      const mockContents: ScrapedContent[] = [
        {
          url: urls[0],
          title: "First",
          content: "Intro",
          metadata: {
            description: "",
            author: "",
            publishedDate: "",
            wordCount: 1,
            links: [],
          },
        },
        {
          url: urls[1],
          title: "Second",
          content: "Body",
          metadata: {
            description: "",
            author: "",
            publishedDate: "",
            wordCount: 1,
            links: [],
          },
        },
      ];

      const scrapeSpy = jest
        .spyOn(webScraper, "scrapeUrl")
        .mockResolvedValueOnce(mockContents[0])
        .mockResolvedValueOnce(mockContents[1]);

      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation(((cb: () => void) => {
          cb();
          return {} as NodeJS.Timeout;
        }) as typeof setTimeout);

      const results = await webScraper.scrapeUrls(urls);

      expect(results).toEqual(mockContents);
      expect(scrapeSpy).toHaveBeenCalledTimes(2);

      setTimeoutSpy.mockRestore();
    });
  });

  describe("processScrapedContent", () => {
    it("chunks scraped content and carries metadata forward", async () => {
      const scraped: ScrapedContent[] = [
        {
          url: "https://example.com/a",
          title: "Article A",
          content: "Intro\n\nBody\n\nSummary",
          metadata: {
            description: "",
            author: "",
            publishedDate: "",
            wordCount: 3,
            links: [],
          },
        },
      ];

      const chunks = await webScraper.processScrapedContent(scraped);

      expect(mockSplitText).toHaveBeenCalledWith("Intro\n\nBody\n\nSummary");
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toMatchObject({
        id: "https://example.com/a-chunk-0",
        content: "Intro",
        metadata: {
          url: "https://example.com/a",
          title: "Article A",
          chunkIndex: 0,
          source: "web",
        },
      });
      expect(chunks[0].metadata.scrapedAt).toEqual(expect.any(String));
    });
  });
});
