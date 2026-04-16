import {
  scrapeUrl,
  scrapeUrls,
  processScrapedContent,
  ScrapedContent,
} from "../webScraper";
import * as cheerio from "cheerio";

// Mock dependencies
jest.mock("puppeteer");
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn().mockImplementation((text: string) => {
      // Simple mock: split by length for testing
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return Promise.resolve(chunks.length > 0 ? chunks : [text]);
    }),
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("webScraper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("scrapeUrl", () => {
    it("should scrape static content successfully", async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta name="author" content="Test Author">
          </head>
          <body>
            <main>
              <h1>Main Title</h1>
              <p>This is the main content of the page.</p>
              <a href="http://example.com/link1">Link 1</a>
              <a href="http://example.com/link2">Link 2</a>
            </main>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.url).toBe("http://example.com");
      expect(result.title).toBe("Test Page");
      expect(result.content).toContain("Main Title");
      expect(result.content).toContain("main content");
      expect(result.metadata.description).toBe("Test description");
      expect(result.metadata.author).toBe("Test Author");
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.links).toContain("http://example.com/link1");
      expect(result.metadata.links).toContain("http://example.com/link2");
    });

    it("should handle pages without meta tags", async () => {
      const mockHtml = `
        <html>
          <head><title>Simple Page</title></head>
          <body><p>Simple content</p></body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.metadata.description).toBe("");
      expect(result.metadata.author).toBe("");
      expect(result.metadata.publishedDate).toBe("");
    });

    it("should handle pages without title", async () => {
      const mockHtml = `
        <html>
          <body>
            <h1>First Heading</h1>
            <p>Content</p>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.title).toBe("First Heading");
    });

    it("should use 'Untitled' when no title or h1 found", async () => {
      const mockHtml = `
        <html>
          <body><p>Content without title</p></body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.title).toBe("Untitled");
    });

    it("should remove script and style elements", async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test</title>
            <style>.test { color: red; }</style>
          </head>
          <body>
            <script>console.log('test');</script>
            <main>Clean content</main>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.content).not.toContain("console.log");
      expect(result.content).not.toContain("color: red");
      expect(result.content).toContain("Clean content");
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // Mock puppeteer to also fail
      const puppeteer = require("puppeteer");
      puppeteer.launch = jest.fn().mockRejectedValue(new Error("Puppeteer failed"));

      await expect(scrapeUrl("http://example.com/notfound")).rejects.toThrow();
    });

    it("should extract Open Graph description", async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test</title>
            <meta property="og:description" content="OG Description">
          </head>
          <body><p>Content</p></body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.metadata.description).toBe("OG Description");
    });

    it("should filter out non-http links", async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="http://example.com/valid">Valid</a>
            <a href="/relative">Relative</a>
            <a href="mailto:test@example.com">Email</a>
            <a href="https://secure.example.com">Secure</a>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      const result = await scrapeUrl("http://example.com");

      expect(result.metadata.links).toContain("http://example.com/valid");
      expect(result.metadata.links).toContain("https://secure.example.com");
      expect(result.metadata.links).not.toContain("/relative");
      expect(result.metadata.links).not.toContain("mailto:test@example.com");
    });
  });

  describe("scrapeUrls", () => {
    it("should scrape multiple URLs successfully", async () => {
      const mockHtml = `
        <html>
          <head><title>Test</title></head>
          <body><p>Content</p></body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      });

      // Mock setTimeout to avoid delays in tests
      jest.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
        cb();
        return {} as NodeJS.Timeout;
      });

      const urls = ["http://example.com/page1", "http://example.com/page2"];
      const results = await scrapeUrls(urls);

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe("http://example.com/page1");
      expect(results[1].url).toBe("http://example.com/page2");
    });

    it("should continue scraping even if one URL fails", async () => {
      const mockHtml = `<html><body><p>Success</p></body></html>`;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockHtml,
        });

      const puppeteer = require("puppeteer");
      puppeteer.launch = jest.fn().mockRejectedValue(new Error("Failed"));

      jest.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
        cb();
        return {} as NodeJS.Timeout;
      });

      const urls = ["http://example.com/fail", "http://example.com/success"];
      const results = await scrapeUrls(urls);

      // Should have the successful one
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle empty URL array", async () => {
      const results = await scrapeUrls([]);
      expect(results).toEqual([]);
    });
  });

  describe("processScrapedContent", () => {
    it("should process scraped content into chunks", async () => {
      const scrapedContent: ScrapedContent[] = [
        {
          url: "http://example.com",
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

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("http://example.com-chunk-0");
      expect(result[0].content).toBe("This is test content.");
      expect(result[0].metadata.url).toBe("http://example.com");
      expect(result[0].metadata.title).toBe("Test Page");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("web");
      expect(result[0].metadata.scrapedAt).toBeDefined();
    });

    it("should split large content into multiple chunks", async () => {
      const largeContent = "a".repeat(2500);
      const scrapedContent: ScrapedContent[] = [
        {
          url: "http://example.com/large",
          title: "Large Page",
          content: largeContent,
          metadata: {
            wordCount: 2500,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContent);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].id).toBe("http://example.com/large-chunk-0");
      expect(result[1].id).toBe("http://example.com/large-chunk-1");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
    });

    it("should process multiple scraped contents", async () => {
      const scrapedContents: ScrapedContent[] = [
        {
          url: "http://example.com/page1",
          title: "Page 1",
          content: "Content 1",
          metadata: { wordCount: 2, links: [] },
        },
        {
          url: "http://example.com/page2",
          title: "Page 2",
          content: "Content 2",
          metadata: { wordCount: 2, links: [] },
        },
      ];

      const result = await processScrapedContent(scrapedContents);

      expect(result).toHaveLength(2);
      expect(result[0].metadata.url).toBe("http://example.com/page1");
      expect(result[1].metadata.url).toBe("http://example.com/page2");
    });

    it("should handle empty scraped content array", async () => {
      const result = await processScrapedContent([]);
      expect(result).toEqual([]);
    });

    it("should include timestamp in metadata", async () => {
      const scrapedContent: ScrapedContent[] = [
        {
          url: "http://example.com",
          title: "Test",
          content: "Content",
          metadata: { wordCount: 1, links: [] },
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
  });
});
