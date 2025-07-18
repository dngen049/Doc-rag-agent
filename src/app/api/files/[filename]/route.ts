import { NextRequest, NextResponse } from "next/server";
import { vectorDB } from "../../../lib/vectordb";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Decode the filename from URL encoding
    const decodedFilename = decodeURIComponent(filename);

    // Delete the document from the vector database
    await vectorDB.deleteDocument(decodedFilename);

    return NextResponse.json({
      message: `File "${decodedFilename}" deleted successfully`,
      filename: decodedFilename,
    });
  } catch (error) {
    console.error("Delete file API error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
