import { POST } from "../db/query/route";
import { NextRequest } from "next/server";
import { DatabaseManager } from "../../lib/database";
import { ChatOllama } from "@langchain/ollama";

jest.mock("../../lib/database");
jest.mock("@langchain/ollama");
jest.mock("../../utils/schemaContext", () => ({
  generateSchemaContext: jest.fn(() => "schema context"),
}));

describe("Database Query API Endpoint", () => {
  let mockConnection: jest.Mocked<Record<string, jest.Mock>>;
  let mockLLM: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      execute: jest.fn(),
    };
    mockLLM = {
      invoke: jest.fn(),
    };
    (ChatOllama as jest.Mock).mockImplementation(() => mockLLM);
  });

  describe("POST /api/db/query", () => {
    it("should generate and return SQL query in read-only mode", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);

      mockLLM.invoke
        .mockResolvedValueOnce({ content: "SELECT * FROM users" })
        .mockResolvedValueOnce({ content: "This query selects all users" });

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get all users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
          readOnly: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sql).toBe("SELECT * FROM users");
      expect(data.explanation).toBe("This query selects all users");
      expect(data.readOnly).toBe(true);
    });

    it("should return 400 error when not connected", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(false);

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get all users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No active database connection");
    });

    it("should return 400 error when required fields are missing", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get all users",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    });

    it("should handle invalid SQL generation", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);

      mockLLM.invoke.mockResolvedValueOnce({
        content: "DROP TABLE users",
      });

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Delete all users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
          readOnly: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("invalid or unsafe");
    });

    it("should execute query when readOnly is false", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      const mockResults = [{ id: 1, name: "John" }];
      mockConnection.execute.mockResolvedValue([mockResults]);

      mockLLM.invoke
        .mockResolvedValueOnce({ content: "SELECT * FROM users" })
        .mockResolvedValueOnce({ content: "Query explanation" });

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get all users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
          readOnly: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual(mockResults);
      expect(data.executionTime).toBeDefined();
    });

    it("should handle query execution errors", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      mockConnection.execute.mockRejectedValue(new Error("Syntax error"));

      mockLLM.invoke.mockResolvedValueOnce({
        content: "SELECT * FROM nonexistent",
      });

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get data",
          selectedTables: ["nonexistent"],
          schema: [],
          readOnly: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Query execution failed");
    });

    it("should handle LLM errors", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);

      mockLLM.invoke.mockRejectedValue(new Error("LLM service error"));

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get all users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to generate SQL query");
    });

    it("should use default maxRows when not provided", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);

      mockLLM.invoke
        .mockResolvedValueOnce({ content: "SELECT * FROM users LIMIT 1000" })
        .mockResolvedValueOnce({ content: "Explanation" });

      const request = new NextRequest("http://localhost:3000/api/db/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Get users",
          selectedTables: ["users"],
          schema: [{ tableName: "users" }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});

