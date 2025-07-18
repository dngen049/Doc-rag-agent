import { ChromaClient, Collection } from "chromadb";
import { OpenAIEmbeddings } from "@langchain/openai";

class VectorDB {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName = "documents";
  private embeddings: OpenAIEmbeddings;

  constructor() {
    const chromaPath = process.env.CHROMA_PATH || "http://localhost:8000";
    console.log("ChromaDB path:", chromaPath);

    this.client = new ChromaClient({
      path: chromaPath,
    });

    // Initialize OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });
  }

  async initialize() {
    try {
      // Try to get existing collection
      this.collection = await this.client.getCollection({
        name: this.collectionName,
      });
    } catch (error) {
      // Create new collection if it doesn't exist
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: "Document embeddings for RAG system",
        },
      });
    }
  }

  async addDocuments(
    documents: Array<{
      id: string;
      content: string;
      metadata: {
        filename: string;
        chunkIndex: number;
        source: string;
      };
    }>
  ) {
    if (!this.collection) {
      await this.initialize();
    }

    const ids = documents.map((doc) => doc.id);
    const texts = documents.map((doc) => doc.content);
    const metadatas = documents.map((doc) => doc.metadata);

    // Generate embeddings for the documents
    const embeddings = await this.embeddings.embedDocuments(texts);

    await this.collection!.add({
      ids,
      documents: texts,
      embeddings: embeddings,
      metadatas,
    });
  }

  async search(query: string, k: number = 5) {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Perform similarity search using embeddings
      const results = await this.collection!.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k,
      });

      return results.documents?.[0] || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  async deleteDocument(filename: string) {
    if (!this.collection) {
      await this.initialize();
    }

    // Get all documents with this filename
    const results = await this.collection!.get({
      where: { filename },
    });

    if (results.ids && results.ids.length > 0) {
      await this.collection!.delete({
        ids: results.ids,
      });
    }
  }

  async getUploadedFiles() {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // Get all documents to extract unique filenames
      const results = await this.collection!.get({
        limit: 1000, // Get a large number to ensure we get all files
      });

      if (!results.metadatas || results.metadatas.length === 0) {
        return [];
      }

      // Extract unique filenames and their metadata
      const fileMap = new Map<
        string,
        { filename: string; chunks: number; uploadedAt?: string }
      >();

      results.metadatas.forEach((metadata) => {
        if (
          metadata &&
          typeof metadata === "object" &&
          "filename" in metadata
        ) {
          const filename = metadata.filename as string;
          if (filename) {
            if (!fileMap.has(filename)) {
              fileMap.set(filename, {
                filename,
                chunks: 1,
                uploadedAt:
                  (metadata as { uploadedAt?: string }).uploadedAt ||
                  new Date().toISOString(),
              });
            } else {
              const existing = fileMap.get(filename)!;
              existing.chunks += 1;
            }
          }
        }
      });

      return Array.from(fileMap.values());
    } catch (error) {
      console.error("Error getting uploaded files:", error);
      return [];
    }
  }
}

// Export singleton instance
export const vectorDB = new VectorDB();
