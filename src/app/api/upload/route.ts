import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload PDF, DOCX, or TXT files only.",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // TODO: Implement actual file processing
    // - Extract text from PDF/DOCX/TXT
    // - Split into chunks
    // - Generate embeddings
    // - Store in ChromaDB

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
