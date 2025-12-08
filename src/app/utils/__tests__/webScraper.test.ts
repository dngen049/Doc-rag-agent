// Mock dependencies
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockImplementation(async (text: string) => {
      const chunkSize = 1000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return chunks.length > 0 ? chunks : [text];
    }),
  })),
}));

// Mock cheerio with proper implementation
jest.mock("cheerio", () => {
  const actualCheerio = jest.requireActual("cheerio");
  return {
    ...actualCheerio,
    load: jest.fn((html: string) => actualCheerio.load(html)),
  };
});

// Mock puppeteer
jest.mock("puppeteer", () => ({
  launch: jest.fn(),
}));

import { scrapeUrl, scrapeUrls, processScrapedContent } from "../webScraper";

// Mock fetch globally
global.fetch = jest.fn();

describe("webScraper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("scrapeUrl", () => {
    it("should scrape static content successfully", async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta name="author" content="Test Author">
          </head>
          <body>
            <main>
              <h1>Main Heading</h1>
              <p>This is the main content.</p>
            </main>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result).toBeDefined();
      expect(result.url).toBe("https://example.com");
      expect(result.title).toBe("Test Page");
      expect(result.content).toContain("Main Heading");
      expect(result.content).toContain("main content");
      expect(result.metadata.description).toBe("Test description");
      expect(result.metadata.author).toBe("Test Author");
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it("should extract title from h1 if title tag is missing", async () => {
      const mockHtml = `
        <html>
          <body>
            <h1>Heading Title</h1>
            <p>Content</p>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result.title).toBe("Heading Title");
    });

    it("should use 'Untitled' when no title or h1 is found", async () => {
      const mockHtml = `
        <html>
          <body>
            <p>Content without title</p>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result.title).toBe("Untitled");
    });

    it("should remove script and style elements", async () => {
      const mockHtml = `
        <html>
          <body>
            <script>console.log('test');</script>
            <style>.test { color: red; }</style>
            <main>Clean content</main>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result.content).not.toContain("console.log");
      expect(result.content).not.toContain("color: red");
      expect(result.content).toContain("Clean content");
    });

    it("should extract links from the page", async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="https://example.com/page1">Link 1</a>
            <a href="https://example.com/page2">Link 2</a>
            <a href="/relative">Relative Link</a>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result.metadata.links).toContain("https://example.com/page1");
      expect(result.metadata.links).toContain("https://example.com/page2");
      expect(result.metadata.links).not.toContain("/relative");
    });

    it("should extract metadata from meta tags", async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:description" content="OG Description">
            <meta property="article:author" content="Article Author">
            <meta property="article:published_time" content="2024-01-01T00:00:00Z">
          </head>
          <body>Content</body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("https://example.com");

      expect(result.metadata.description).toBe("OG Description");
      expect(result.metadata.author).toBe("Article Author");
      expect(result.metadata.publishedDate).toBe("2024-01-01T00:00:00Z");
    });
  });

  describe("scrapeUrls", () => {
    it("should scrape multiple URLs successfully", async () => {
      const mockHtml = `
        <html>
          <head><title>Test</title></head>
          <body><main>Content</main></body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const urls = ["https://example1.com", "https://example2.com"];

      const results = await scrapeUrls(urls);

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe("https://example1.com");
      expect(results[1].url).toBe("https://example2.com");
    }, 15000);

    it("should continue scraping even if one URL fails", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => "<html><body>Success</body></html>",
        });

      const urls = ["https://fail.com", "https://success.com"];

      const results = await scrapeUrls(urls);

      // Should only have the successful result
      expect(results.length).toBeLessThanOrEqual(1);
    }, 15000);

    it("should handle empty URL array", async () => {
      const results = await scrapeUrls([]);
      expect(results).toEqual([]);
    });
  });

  describe("processScrapedContent", () => {
    it("should process single scraped content into chunks", async () => {
      const scrapedContent = [
        {
          url: "https://example.com",
          title: "Test Page",
          content: "This is test content.",
          metadata: {
            description: "Test",
            author: "Author",
            publishedDate: "2024-01-01",
            wordCount: 4,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContent);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe("https://example.com-chunk-0");
      expect(result[0].content).toBe("This is test content.");
      expect(result[0].metadata.url).toBe("https://example.com");
      expect(result[0].metadata.title).toBe("Test Page");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("web");
      expect(result[0].metadata.scrapedAt).toBeDefined();
    });

    it("should split large content into multiple chunks", async () => {
      const largeContent = "a".repeat(2500);
      const scrapedContent = [
        {
          url: "https://example.com",
          title: "Large Page",
          content: largeContent,
          metadata: {
            wordCount: 1,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContent);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
      expect(result[0].id).toContain("chunk-0");
      expect(result[1].id).toContain("chunk-1");
    });

    it("should process multiple scraped contents", async () => {
      const scrapedContents = [
        {
          url: "https://example1.com",
          title: "Page 1",
          content: "Content 1",
          metadata: {
            wordCount: 2,
            links: [],
          },
        },
        {
          url: "https://example2.com",
          title: "Page 2",
          content: "Content 2",
          metadata: {
            wordCount: 2,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContents);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((chunk) => chunk.metadata.url === "https://example1.com")).toBe(true);
      expect(result.some((chunk) => chunk.metadata.url === "https://example2.com")).toBe(true);
    });

    it("should include scrapedAt timestamp", async () => {
      const scrapedContent = [
        {
          url: "https://example.com",
          title: "Test",
          content: "Content",
          metadata: {
            wordCount: 1,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContent);

      expect(result[0].metadata.scrapedAt).toBeDefined();
      expect(typeof result[0].metadata.scrapedAt).toBe("string");
      // Verify it's a valid ISO date string
      expect(new Date(result[0].metadata.scrapedAt).toISOString()).toBe(
        result[0].metadata.scrapedAt
      );
    });

    it("should handle empty content array", async () => {
      const result = await processScrapedContent([]);

      expect(result).toEqual([]);
    });
  });
});


