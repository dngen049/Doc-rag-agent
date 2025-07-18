import { ChromaClient, Collection } from "chromadb";

class VectorDB {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName = "documents";

  constructor() {
    const chromaPath = process.env.CHROMA_PATH || "http://localhost:8000";
    console.log("ChromaDB path:", chromaPath);

    this.client = new ChromaClient({
      path: chromaPath,
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

    await this.collection!.add({
      ids,
      documents: texts,
      metadatas,
    });
  }

  async search(query: string, k: number = 5) {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // For now, return all documents since we don't have embeddings set up
      const results = await this.collection!.get({
        limit: k,
      });

      return results.documents || [];
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
}

// Export singleton instance
export const vectorDB = new VectorDB();
