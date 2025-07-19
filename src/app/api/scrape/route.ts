import { NextRequest, NextResponse } from "next/server";
import { scrapeUrls, processScrapedContent } from "../../utils/webScraper";
import { vectorDB } from "../../lib/vectordb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide a valid array of URLs" },
        { status: 400 }
      );
    }

    // Validate URLs
    const validUrls = urls.filter((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 }
      );
    }

    // Limit number of URLs to prevent abuse
    if (validUrls.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 URLs allowed per request" },
        { status: 400 }
      );
    }

    console.log(`Starting to scrape ${validUrls.length} URLs`);

    // Scrape all URLs
    const scrapedContents = await scrapeUrls(validUrls);

    if (scrapedContents.length === 0) {
      return NextResponse.json(
        { error: "Failed to scrape any URLs" },
        { status: 500 }
      );
    }

    // Process scraped content into chunks
    const chunks = await processScrapedContent(scrapedContents);

    // Store chunks in vector database
    await vectorDB.addDocuments(chunks);

    // Prepare response data
    const responseData = scrapedContents.map((content) => ({
      url: content.url,
      title: content.title,
      wordCount: content.metadata.wordCount,
      description: content.metadata.description,
      author: content.metadata.author,
      publishedDate: content.metadata.publishedDate,
      links: content.metadata.links.length,
    }));

    return NextResponse.json({
      message: "Web content scraped and processed successfully",
      scraped: responseData,
      totalUrls: validUrls.length,
      successfulScrapes: scrapedContents.length,
      totalChunks: chunks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
