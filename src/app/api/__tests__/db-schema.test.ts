import { GET } from "../db/schema/route";
import { DatabaseManager } from "../../lib/database";

jest.mock("../../lib/database");

describe("Database Schema API Endpoint", () => {
  let mockConnection: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      execute: jest.fn(),
    } as jest.Mocked<Record<string, jest.Mock>>;
  });

  describe("GET /api/db/schema", () => {
    it("should return database schema when connected", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      const mockTables = [
        { tableName: "users", tableComment: "User table" },
      ];
      const mockColumns = [
        {
          columnName: "id",
          dataType: "INT",
          isNullable: "NO",
          columnKey: "PRI",
          columnDefault: null,
          columnComment: "Primary key",
          extra: "auto_increment",
        },
      ];
      const mockForeignKeys: Record<string, unknown>[] = [];
      const mockPrimaryKeys = [{ columnName: "id" }];

      mockConnection.execute
        .mockResolvedValueOnce([mockTables])
        .mockResolvedValueOnce([mockColumns])
        .mockResolvedValueOnce([mockForeignKeys])
        .mockResolvedValueOnce([mockPrimaryKeys]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.schema).toBeDefined();
      expect(data.tableCount).toBe(1);
      expect(data.schema[0].tableName).toBe("users");
      expect(data.schema[0].columns).toEqual(mockColumns);
      expect(data.schema[0].primaryKeys).toEqual(["id"]);
    });

    it("should return 400 error when not connected", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No active database connection");
    });

    it("should return 500 error when connection is null", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database connection not available");
    });

    it("should include table comments and column details", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      const mockTables = [
        { tableName: "users", tableComment: "User accounts" },
      ];
      const mockColumns = [
        {
          columnName: "id",
          dataType: "INT",
          isNullable: "NO",
          columnKey: "PRI",
          columnDefault: null,
          columnComment: "Primary key",
          extra: "auto_increment",
        },
        {
          columnName: "email",
          dataType: "VARCHAR",
          isNullable: "NO",
          columnKey: "UNI",
          columnDefault: null,
          columnComment: "User email",
          extra: "",
        },
      ];
      const mockPrimaryKeys = [{ columnName: "id" }];

      mockConnection.execute
        .mockResolvedValueOnce([mockTables])
        .mockResolvedValueOnce([mockColumns])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockPrimaryKeys]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tableCount).toBe(1);
      expect(data.schema[0].tableName).toBe("users");
      expect(data.schema[0].tableComment).toBe("User accounts");
      expect(data.schema[0].columns.length).toBe(2);
      expect(data.schema[0].primaryKeys).toEqual(["id"]);
    });

    it("should handle database query errors", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      mockConnection.execute.mockRejectedValue(new Error("Query failed"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve database schema");
      expect(data.details).toBe("Query failed");
    });

    it("should handle empty schema", async () => {
      (DatabaseManager.isConnected as jest.Mock).mockReturnValue(true);
      (DatabaseManager.getConnection as jest.Mock).mockReturnValue(
        mockConnection
      );

      // Return empty array for tables query
      mockConnection.execute.mockResolvedValueOnce([[]]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schema).toEqual([]);
      expect(data.tableCount).toBe(0);
    });
  });
});

