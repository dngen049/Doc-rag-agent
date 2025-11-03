"use client";

import { useState } from "react";

interface WebScrapeFormProps {
  onScrapeSuccess?: () => void;
}

interface ScrapedContent {
  url: string;
  title: string;
  wordCount: number;
  description?: string;
  author?: string;
  publishedDate?: string;
  links: number;
}

export default function WebScrapeForm({ onScrapeSuccess }: WebScrapeFormProps) {
  const [urls, setUrls] = useState<string>("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string>("");
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent[]>([]);

  const handleUrlInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrls(e.target.value);
  };

  const handleScrape = async () => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      setScrapeStatus("Error: Please enter at least one URL.");
      return;
    }

    if (urlList.length > 10) {
      setScrapeStatus("Error: Maximum 10 URLs allowed per request.");
      return;
    }

    // Validate URLs
    const validUrls = urlList.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      setScrapeStatus("Error: No valid URLs provided.");
      return;
    }

    setIsScraping(true);
    setScrapeStatus("Scraping web content...");
    setScrapedContent([]);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: validUrls }),
      });

      if (response.ok) {
        const data = await response.json();
        setScrapeStatus(
          `Success! Scraped ${data.successfulScrapes} out of ${data.totalUrls} URLs.`
        );
        setScrapedContent(data.scraped || []);
        onScrapeSuccess?.();
      } else {
        const errorData = await response.json();
        setScrapeStatus(`Error: ${errorData.error || "Scraping failed"}`);
      }
    } catch (_error) {
      setScrapeStatus("Error: Failed to scrape URLs. Please try again.");
    } finally {
      setIsScraping(false);
    }
  };

  const clearResults = () => {
    setScrapedContent([]);
    setScrapeStatus("");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Scrape Web Content
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URLs (one per line)
          </label>
          <textarea
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="https://example.com/article1&#10;https://example.com/article2&#10;https://example.com/blog-post"
            value={urls}
            onChange={handleUrlInput}
            disabled={isScraping}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter URLs to scrape (max 10 URLs per request)
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleScrape}
            disabled={isScraping || !urls.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isScraping ? "Scraping..." : "Scrape Content"}
          </button>
          {scrapedContent.length > 0 && (
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>

        {scrapeStatus && (
          <div
            className={`p-3 rounded-lg text-sm ${
              scrapeStatus.startsWith("Error")
                ? "bg-red-100 text-red-700"
                : scrapeStatus.startsWith("Success")
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {scrapeStatus}
          </div>
        )}

        {isScraping && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">
              Scraping content from{" "}
              {urls.split("\n").filter((u) => u.trim()).length} URLs...
            </span>
          </div>
        )}

        {scrapedContent.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">
              Scraped Content ({scrapedContent.length} items)
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scrapedContent.map((content, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {content.title}
                      </h5>
                      <p className="text-sm text-blue-600 mb-2 break-all">
                        {content.url}
                      </p>
                      {content.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Words: {content.wordCount}</span>
                        {content.author && (
                          <span>Author: {content.author}</span>
                        )}
                        {content.publishedDate && (
                          <span>
                            Published:{" "}
                            {new Date(
                              content.publishedDate
                            ).toLocaleDateString()}
                          </span>
                        )}
                        <span>Links: {content.links}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Scraped
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
