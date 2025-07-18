import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // TODO: Implement actual LangChain integration
    // For now, return a mock response
    const mockResponse = `I received your message: "${message}". This is a mock response. The actual implementation will use LangChain to process your document and provide relevant answers.`;

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      response: mockResponse,
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
