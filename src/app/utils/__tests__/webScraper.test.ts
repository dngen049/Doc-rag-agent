jest.mock("cheerio");
jest.mock("puppeteer");
jest.mock("langchain/text_splitter");

import { scrapeUrl, scrapeUrls, processScrapedContent } from "../webScraper";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

describe("webScraper", () => {
  let mockSplitText: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSplitText = jest.fn();
    (RecursiveCharacterTextSplitter as jest.Mock).mockImplementation(() => ({
      splitText: mockSplitText,
    }));
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
            <main>Test content</main>
            <a href="http://example.com">Link</a>
          </body>
        </html>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const mockCheerio = {
        load: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue("Test Page"),
          first: jest.fn().mockReturnThis(),
          trim: jest.fn().mockReturnThis(),
          remove: jest.fn(),
          length: 1,
          attr: jest.fn((attr) => {
            if (attr === "content") return "Test description";
            if (attr === "href") return "http://example.com";
            return "";
          }),
          map: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(["http://example.com"]),
          }),
        }),
      };

      (cheerio.load as jest.Mock) = mockCheerio.load;

      const result = await scrapeUrl("http://example.com");

      expect(result.url).toBe("http://example.com");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com",
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringContaining("Mozilla"),
          }),
        })
      );
    });

    it("should handle HTTP errors and fallback to puppeteer", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setUserAgent: jest.fn(),
          goto: jest.fn(),
          title: jest.fn().mockResolvedValue("Puppeteer Title"),
          evaluate: jest.fn()
            .mockResolvedValueOnce("Puppeteer content")
            .mockResolvedValueOnce({
              description: "Puppeteer description",
              author: "Puppeteer Author",
              publishedDate: "2024-01-01",
              links: [],
            }),
        }),
        close: jest.fn(),
      };

      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

      const result = await scrapeUrl("http://example.com");

      expect(result.title).toBe("Puppeteer Title");
      expect(result.content).toContain("Puppeteer content");
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("scrapeUrls", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should scrape multiple URLs successfully", async () => {
      const mockHtml = `
        <html>
          <head><title>Test</title></head>
          <body><main>Content</main></body>
        </html>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const mockLoad = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue("Test"),
        first: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        remove: jest.fn(),
        length: 1,
        attr: jest.fn().mockReturnValue(""),
        map: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue([]),
        }),
      });

      (cheerio.load as jest.Mock) = mockLoad;

      const urls = ["http://example1.com", "http://example2.com"];
      const promise = scrapeUrls(urls);

      // Fast-forward timers for delays
      jest.advanceTimersByTime(2000);

      const results = await promise;

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe("http://example1.com");
      expect(results[1].url).toBe("http://example2.com");
    });

    it("should continue scraping even if one URL fails", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue("<html><title>Success</title></html>"),
        });

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setUserAgent: jest.fn(),
          goto: jest.fn().mockRejectedValue(new Error("Failed")),
        }),
        close: jest.fn(),
      };

      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

      const mockLoad = jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue("Success"),
        first: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        remove: jest.fn(),
        length: 1,
        attr: jest.fn().mockReturnValue(""),
        map: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue([]),
        }),
      });

      (cheerio.load as jest.Mock) = mockLoad;

      const urls = ["http://fail.com", "http://success.com"];
      const promise = scrapeUrls(urls);

      jest.advanceTimersByTime(2000);

      const results = await promise;

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("processScrapedContent", () => {
    it("should process scraped content into chunks", async () => {
      const scrapedContents = [
        {
          url: "http://example.com",
          title: "Example",
          content: "This is example content",
          metadata: {
            description: "Description",
            author: "Author",
            publishedDate: "2024-01-01",
            wordCount: 4,
            links: [],
          },
        },
      ];

      mockSplitText.mockResolvedValue(["chunk1", "chunk2"]);

      const result = await processScrapedContent(scrapedContents);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("http://example.com-chunk-0");
      expect(result[0].content).toBe("chunk1");
      expect(result[0].metadata.url).toBe("http://example.com");
      expect(result[0].metadata.title).toBe("Example");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("web");
      expect(result[0].metadata.scrapedAt).toBeDefined();
      expect(result[1].id).toBe("http://example.com-chunk-1");
      expect(result[1].content).toBe("chunk2");
      expect(result[1].metadata.chunkIndex).toBe(1);
    });

    it("should process multiple scraped contents", async () => {
      const scrapedContents = [
        {
          url: "http://example1.com",
          title: "Example 1",
          content: "Content 1",
          metadata: {
            wordCount: 2,
            links: [],
          },
        },
        {
          url: "http://example2.com",
          title: "Example 2",
          content: "Content 2",
          metadata: {
            wordCount: 2,
            links: [],
          },
        },
      ];

      mockSplitText.mockResolvedValue(["chunk"]);

      const result = await processScrapedContent(scrapedContents);

      expect(result).toHaveLength(2);
      expect(result[0].metadata.url).toBe("http://example1.com");
      expect(result[1].metadata.url).toBe("http://example2.com");
    });

    it("should handle empty content array", async () => {
      const scrapedContents: any[] = [];

      const result = await processScrapedContent(scrapedContents);

      expect(result).toHaveLength(0);
    });
  });
});

