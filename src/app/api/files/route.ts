import { NextResponse } from "next/server";
import { vectorDB } from "../../lib/vectordb";

export async function GET() {
  try {
    const files = await vectorDB.getUploadedFiles();

    return NextResponse.json({
      files,
      count: files.length,
    });
  } catch (error) {
    console.error("Files API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch uploaded files" },
      { status: 500 }
    );
  }
}
