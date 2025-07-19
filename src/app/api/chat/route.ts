import { NextRequest, NextResponse } from "next/server";
import { langChainService } from "../../lib/langchain";

export async function POST(request: NextRequest) {
  try {
    const { message, selectedDocuments, multiSelectMode } =
      await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Use LangChain service for RAG-based chat with selected documents
    const response = await langChainService.chatWithRAG(
      message,
      selectedDocuments,
      multiSelectMode
    );

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
