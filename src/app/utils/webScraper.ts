import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Text splitter for chunking web content
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    author?: string;
    publishedDate?: string;
    wordCount: number;
    links: string[];
  };
}

export interface ScrapedChunk {
  id: string;
  content: string;
  metadata: {
    url: string;
    title: string;
    chunkIndex: number;
    source: "web";
    scrapedAt: string;
  };
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    // First try with cheerio for static content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

    // Extract main content - try different selectors
    let content = "";

    // Remove script and style elements
    $(
      "script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .menu"
    ).remove();

    // Try to find main content area
    const mainSelectors = [
      "main",
      "article",
      ".content",
      ".post-content",
      ".entry-content",
      "#content",
      ".main-content",
    ];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // If no main content found, use body
    if (!content) {
      content = $("body").text().trim();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim();

    // Extract metadata
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      "";

    const publishedDate =
      $('meta[property="article:published_time"]').attr("content") ||
      $("time[datetime]").attr("datetime") ||
      "";

    // Extract links
    const links = $("a[href]")
      .map((_: number, el: cheerio.Element) => $(el).attr("href"))
      .get()
      .filter((href: string | undefined) => href && href.startsWith("http"));

    return {
      url,
      title,
      content,
      metadata: {
        description,
        author,
        publishedDate,
        wordCount: content.split(/\s+/).length,
        links,
      },
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);

    // If cheerio fails, try with puppeteer for dynamic content
    return await scrapeWithPuppeteer(url);
  }
}

async function scrapeWithPuppeteer(url: string): Promise<ScrapedContent> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate to the page
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Extract content
    const content = await page.evaluate(() => {
      // Remove unwanted elements
      const elementsToRemove = document.querySelectorAll(
        "script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .menu"
      );
      elementsToRemove.forEach((el) => el.remove());

      // Try to find main content
      const mainSelectors = [
        "main",
        "article",
        ".content",
        ".post-content",
        ".entry-content",
        "#content",
        ".main-content",
      ];

      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent?.trim() || "";
        }
      }

      // Fallback to body
      return document.body.textContent?.trim() || "";
    });

    const title = await page.title();

    // Extract metadata
    const metadata = await page.evaluate(() => {
      const description =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") ||
        "";

      const author =
        document
          .querySelector('meta[name="author"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="article:author"]')
          ?.getAttribute("content") ||
        "";

      const publishedDate =
        document
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute("content") ||
        document.querySelector("time[datetime]")?.getAttribute("datetime") ||
        "";

      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter((href) => href && href.startsWith("http"));

      return { description, author, publishedDate, links };
    });

    return {
      url,
      title,
      content: content.replace(/\s+/g, " ").trim(),
      metadata: {
        ...metadata,
        wordCount: content.split(/\s+/).length,
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];

  for (const url of urls) {
    try {
      console.log(`Scraping: ${url}`);
      const content = await scrapeUrl(url);
      results.push(content);

      // Add a small delay to be respectful to servers
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      // Continue with other URLs even if one fails
    }
  }

  return results;
}

export async function processScrapedContent(
  scrapedContents: ScrapedContent[]
): Promise<ScrapedChunk[]> {
  const allChunks: ScrapedChunk[] = [];

  for (const content of scrapedContents) {
    // Split content into chunks
    const chunks = await textSplitter.splitText(content.content);

    // Convert chunks to our format
    const contentChunks = chunks.map((chunk: string, index: number) => ({
      id: `${content.url}-chunk-${index}`,
      content: chunk,
      metadata: {
        url: content.url,
        title: content.title,
        chunkIndex: index,
        source: "web" as const,
        scrapedAt: new Date().toISOString(),
      },
    }));

    allChunks.push(...contentChunks);
  }

  return allChunks;
}
