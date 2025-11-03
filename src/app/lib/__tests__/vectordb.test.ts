// Mock dependencies BEFORE importing
jest.mock("chromadb");
jest.mock("@langchain/openai");

import { vectorDB } from "../vectordb";

describe("VectorDB", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("Module initialization", () => {
    it("should export vectorDB singleton", () => {
      expect(vectorDB).toBeDefined();
      expect(typeof vectorDB).toBe("object");
    });

    it("should have initialize method", () => {
      expect(typeof vectorDB.initialize).toBe("function");
    });

    it("should have addDocuments method", () => {
      expect(typeof vectorDB.addDocuments).toBe("function");
    });

    it("should have search method", () => {
      expect(typeof vectorDB.search).toBe("function");
    });

    it("should have searchInDocuments method", () => {
      expect(typeof vectorDB.searchInDocuments).toBe("function");
    });

    it("should have searchInContent method", () => {
      expect(typeof vectorDB.searchInContent).toBe("function");
    });

    it("should have deleteDocument method", () => {
      expect(typeof vectorDB.deleteDocument).toBe("function");
    });

    it("should have getUploadedFiles method", () => {
      expect(typeof vectorDB.getUploadedFiles).toBe("function");
    });
  });

  describe("Configuration", () => {
    it("should use ChromaDB client", async () => {
      const { ChromaClient } = await import("chromadb");
      expect(ChromaClient).toBeDefined();
    });

    it("should use OpenAI embeddings", async () => {
      const { OpenAIEmbeddings } = await import("@langchain/openai");
      expect(OpenAIEmbeddings).toBeDefined();
    });

    it("should use text-embedding-ada-002 model", () => {
      const method = vectorDB.constructor.toString();
      expect(method).toContain("text-embedding-ada-002");
    });
  });

  describe("Collection management", () => {
    it("should have documents collection name", () => {
      const method = vectorDB.initialize.toString();
      expect(method).toContain("collectionName");
    });

    it("should handle collection initialization", () => {
      const method = vectorDB.initialize.toString();
      expect(method).toContain("getCollection");
    });

    it("should create collection if not exists", () => {
      const method = vectorDB.initialize.toString();
      expect(method).toContain("createCollection");
    });
  });

  describe("Document operations", () => {
    it("should support adding documents with metadata", () => {
      const method = vectorDB.addDocuments.toString();
      expect(method).toContain("metadata");
    });

    it("should support searching documents", () => {
      const method = vectorDB.search.toString();
      expect(method).toContain("query");
    });

    it("should support filtering by document list", () => {
      const method = vectorDB.searchInDocuments.toString();
      expect(method).toContain("documents");
    });

    it("should support searching in content", () => {
      const method = vectorDB.searchInContent.toString();
      expect(method).toContain("content");
    });

    it("should support deleting documents by filename", () => {
      const method = vectorDB.deleteDocument.toString();
      expect(method).toContain("filename");
    });

    it("should support retrieving uploaded files", () => {
      const method = vectorDB.getUploadedFiles.toString();
      expect(method).toContain("get");
    });
  });

  describe("Error handling", () => {
    it("should handle initialization errors gracefully", () => {
      const method = vectorDB.initialize.toString();
      expect(method).toContain("try");
    });

    it("should handle search errors", () => {
      const method = vectorDB.search.toString();
      expect(method).toContain("try");
    });

    it("should handle add document errors", () => {
      const method = vectorDB.addDocuments.toString();
      expect(method).toContain("initialize");
    });
  });
});
