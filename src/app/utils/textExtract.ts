import { readFile } from "fs/promises";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Text splitter for chunking documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export interface ExtractedChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    chunkIndex: number;
    source: string;
  };
}

export async function extractTextFromFile(
  file: File,
  filename: string
): Promise<ExtractedChunk[]> {
  try {
    let text = "";

    if (file.type === "text/plain") {
      // Handle TXT files
      text = await file.text();
    } else if (
      file.type === "text/markdown" ||
      file.type === "text/x-markdown"
    ) {
      // Handle MD files
      text = await file.text();
    } else {
      // For now, only support TXT and MD files
      throw new Error(
        `Unsupported file type: ${file.type}. Only TXT and MD files are supported for now.`
      );
    }

    // Split text into chunks
    const chunks = await textSplitter.splitText(text);

    // Convert chunks to our format
    return chunks.map((chunk: string, index: number) => ({
      id: `${filename}-chunk-${index}`,
      content: chunk,
      metadata: {
        filename,
        chunkIndex: index,
        source: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract text from ${filename}`);
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedChunk[]> {
  try {
    let text = "";

    if (mimeType === "text/plain") {
      // Handle TXT files
      text = buffer.toString("utf-8");
    } else if (mimeType === "text/markdown" || mimeType === "text/x-markdown") {
      // Handle MD files
      text = buffer.toString("utf-8");
    } else {
      // For now, only support TXT and MD files
      throw new Error(
        `Unsupported file type: ${mimeType}. Only TXT and MD files are supported for now.`
      );
    }

    // Split text into chunks
    const chunks = await textSplitter.splitText(text);

    // Convert chunks to our format
    return chunks.map((chunk: string, index: number) => ({
      id: `${filename}-chunk-${index}`,
      content: chunk,
      metadata: {
        filename,
        chunkIndex: index,
        source: filename,
        uploadedAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error(`Failed to extract text from ${filename}`);
  }
}
