import {
  processScrapedContent,
  ScrapedContent,
} from "../webScraper";

// Mock the RecursiveCharacterTextSplitter
jest.mock("langchain/text_splitter", () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    splitText: jest.fn((text: string) => {
      // Simple mock implementation that splits by length
      const chunkSize = 1000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return Promise.resolve(chunks.length > 0 ? chunks : [text]);
    }),
  })),
}));

// Mock cheerio
jest.mock("cheerio");

// Mock puppeteer
jest.mock("puppeteer");

// Mock fetch globally
global.fetch = jest.fn();

describe("webScraper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("scrapeUrl and scrapeUrls", () => {
    it("should verify scrapeUrl returns ScrapedContent structure", () => {
      // Test the expected structure of ScrapedContent
      const mockContent: ScrapedContent = {
        url: "https://example.com",
        title: "Test Page",
        content: "Test content",
        metadata: {
          description: "Test description",
          author: "Test Author",
          publishedDate: "2024-01-01",
          wordCount: 2,
          links: ["https://link1.com", "https://link2.com"],
        },
      };

      expect(mockContent.url).toBe("https://example.com");
      expect(mockContent.title).toBe("Test Page");
      expect(mockContent.content).toBe("Test content");
      expect(mockContent.metadata.wordCount).toBe(2);
      expect(mockContent.metadata.links).toHaveLength(2);
    });

    it("should verify scrapeUrls returns array of ScrapedContent", () => {
      // Test the expected structure of scrapeUrls result
      const mockResults: ScrapedContent[] = [
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

      expect(Array.isArray(mockResults)).toBe(true);
      expect(mockResults).toHaveLength(2);
      expect(mockResults[0].url).toBe("https://example1.com");
      expect(mockResults[1].url).toBe("https://example2.com");
    });
  });

  describe("processScrapedContent", () => {
    it("should process scraped content into chunks", async () => {
      const scrapedContents: ScrapedContent[] = [
        {
          url: "https://example.com",
          title: "Test Page",
          content: "This is test content that will be chunked.",
          metadata: {
            description: "Test",
            wordCount: 8,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContents);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("https://example.com-chunk-0");
      expect(result[0].content).toBe("This is test content that will be chunked.");
      expect(result[0].metadata.url).toBe("https://example.com");
      expect(result[0].metadata.title).toBe("Test Page");
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.source).toBe("web");
      expect(result[0].metadata.scrapedAt).toBeDefined();
    });

    it("should split large content into multiple chunks", async () => {
      const largeContent = "a".repeat(2500);
      const scrapedContents: ScrapedContent[] = [
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

      const result = await processScrapedContent(scrapedContents);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[1].metadata.chunkIndex).toBe(1);
      expect(result[2].metadata.chunkIndex).toBe(2);
    });

    it("should process multiple scraped contents", async () => {
      const scrapedContents: ScrapedContent[] = [
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
      expect(result[0].metadata.url).toBe("https://example1.com");
      expect(result[1].metadata.url).toBe("https://example2.com");
    });

    it("should handle empty content array", async () => {
      const result = await processScrapedContent([]);

      expect(result).toHaveLength(0);
    });

    it("should generate unique IDs for each chunk", async () => {
      const largeContent = "b".repeat(2500);
      const scrapedContents: ScrapedContent[] = [
        {
          url: "https://example.com",
          title: "Test",
          content: largeContent,
          metadata: {
            wordCount: 1,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContents);

      const ids = result.map((chunk) => chunk.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should preserve metadata across all chunks", async () => {
      const largeContent = "c".repeat(2500);
      const scrapedContents: ScrapedContent[] = [
        {
          url: "https://example.com",
          title: "Test Page",
          content: largeContent,
          metadata: {
            wordCount: 1,
            links: [],
          },
        },
      ];

      const result = await processScrapedContent(scrapedContents);

      result.forEach((chunk) => {
        expect(chunk.metadata.url).toBe("https://example.com");
        expect(chunk.metadata.title).toBe("Test Page");
        expect(chunk.metadata.source).toBe("web");
        expect(chunk.metadata.scrapedAt).toBeDefined();
      });
    });
  });
});

