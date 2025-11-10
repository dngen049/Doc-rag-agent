import { POST } from "../scrape/route";
import { NextRequest } from "next/server";
import { scrapeUrls, processScrapedContent } from "../../utils/webScraper";
import { vectorDB } from "../../lib/vectordb";

jest.mock("../../utils/webScraper");
jest.mock("../../lib/vectordb");

describe("Scrape API Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/scrape", () => {
    it("should successfully scrape and process URLs", async () => {
      const mockScrapedContent = [
        {
          url: "https://example.com",
          title: "Example",
          metadata: {
            wordCount: 100,
            description: "Test",
            author: "Author",
            publishedDate: "2024-01-01",
            links: [],
          },
        },
      ];
      const mockChunks = [{ content: "chunk", metadata: {} }];

      (scrapeUrls as jest.Mock).mockResolvedValue(mockScrapedContent);
      (processScrapedContent as jest.Mock).mockResolvedValue(mockChunks);
      (vectorDB.addDocuments as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls: ["https://example.com"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("scraped and processed successfully");
      expect(data.totalUrls).toBe(1);
      expect(data.successfulScrapes).toBe(1);
      expect(data.totalChunks).toBe(1);
      expect(data.timestamp).toBeDefined();
    });

    it("should return 400 error when no URLs provided", async () => {
      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("valid array of URLs");
    });

    it("should return 400 error when URLs is not an array", async () => {
      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({ urls: "not-an-array" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("valid array of URLs");
    });

    it("should filter out invalid URLs", async () => {
      const mockScrapedContent = [
        {
          url: "https://valid.com",
          title: "Valid",
          metadata: {
            wordCount: 50,
            description: "Test",
            author: "Author",
            publishedDate: "2024-01-01",
            links: [],
          },
        },
      ];
      const mockChunks = [{ content: "chunk", metadata: {} }];

      (scrapeUrls as jest.Mock).mockResolvedValue(mockScrapedContent);
      (processScrapedContent as jest.Mock).mockResolvedValue(mockChunks);
      (vectorDB.addDocuments as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls: ["https://valid.com", "not-a-url", "also-invalid"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalUrls).toBe(1);
    });

    it("should return 400 error when all URLs are invalid", async () => {
      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls: ["not-a-url", "also-invalid"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("No valid URLs provided");
    });

    it("should return 400 error when more than 10 URLs provided", async () => {
      const urls = Array.from({ length: 11 }, (_, i) =>
        `https://example${i}.com`
      );

      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({ urls }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Maximum 10 URLs allowed");
    });

    it("should return 500 error when scraping fails", async () => {
      (scrapeUrls as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls: ["https://example.com"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to scrape");
    });

    it("should handle processing errors", async () => {
      const mockScrapedContent = [
        {
          url: "https://example.com",
          title: "Example",
          metadata: {
            wordCount: 100,
            description: "Test",
            author: "Author",
            publishedDate: "2024-01-01",
            links: [],
          },
        },
      ];

      (scrapeUrls as jest.Mock).mockResolvedValue(mockScrapedContent);
      (processScrapedContent as jest.Mock).mockRejectedValue(
        new Error("Processing failed")
      );

      const request = new NextRequest("http://localhost:3000/api/scrape", {
        method: "POST",
        body: JSON.stringify({
          urls: ["https://example.com"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});

