import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "../../utils/textExtract";
import { vectorDB } from "../../lib/vectordb";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["text/plain", "text/markdown", "text/x-markdown"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload TXT or MD files only." },
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text and create chunks
    const chunks = await extractTextFromBuffer(buffer, file.name, file.type);

    // Store chunks in vector database
    await vectorDB.addDocuments(chunks);

    return NextResponse.json({
      message: "File uploaded and processed successfully",
      filename: file.name,
      size: file.size,
      type: file.type,
      chunks: chunks.length,
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
