import { generateSchemaContext, generateSchemaSummary } from "../schemaContext";
import { TableSchema } from "@/app/types/database";

describe("schemaContext", () => {
  describe("generateSchemaContext", () => {
    const mockSchema: TableSchema[] = [
      {
        tableName: "users",
        tableComment: "User accounts",
        columns: [
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
            dataType: "VARCHAR(255)",
            isNullable: "NO",
            columnKey: "UNI",
            columnDefault: null,
            columnComment: "User email address",
            extra: "",
          },
          {
            columnName: "created_at",
            dataType: "TIMESTAMP",
            isNullable: "YES",
            columnKey: "",
            columnDefault: "CURRENT_TIMESTAMP",
            columnComment: "",
            extra: "",
          },
        ],
        foreignKeys: [],
        primaryKeys: ["id"],
      },
      {
        tableName: "posts",
        tableComment: "Blog posts",
        columns: [
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
            columnName: "user_id",
            dataType: "INT",
            isNullable: "NO",
            columnKey: "MUL",
            columnDefault: null,
            columnComment: "Author user ID",
            extra: "",
          },
          {
            columnName: "title",
            dataType: "VARCHAR(255)",
            isNullable: "NO",
            columnKey: "",
            columnDefault: null,
            columnComment: "",
            extra: "",
          },
        ],
        foreignKeys: [
          {
            columnName: "user_id",
            referencedTable: "users",
            referencedColumn: "id",
          },
        ],
        primaryKeys: ["id"],
      },
    ];

    it("should return message when no tables selected", () => {
      const result = generateSchemaContext(mockSchema, []);
      expect(result).toBe("No tables selected for context.");
    });

    it("should generate context for single table without foreign keys", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);

      expect(result).toContain("Database Schema Context:");
      expect(result).toContain("Table: users (User accounts)");
      expect(result).toContain("Columns:");
      expect(result).toContain("id: INT (Primary Key) NOT NULL - Primary key");
      expect(result).toContain("email: VARCHAR(255) NOT NULL - User email address");
      expect(result).toContain("created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      expect(result).not.toContain("Foreign Keys:");
    });

    it("should generate context for table with foreign keys", () => {
      const result = generateSchemaContext(mockSchema, ["posts"]);

      expect(result).toContain("Table: posts (Blog posts)");
      expect(result).toContain("user_id: INT (Foreign Key) NOT NULL - Author user ID");
      expect(result).toContain("Foreign Keys:");
      expect(result).toContain("user_id → users.id");
    });

    it("should generate context for multiple tables", () => {
      const result = generateSchemaContext(mockSchema, ["users", "posts"]);

      expect(result).toContain("Table: users");
      expect(result).toContain("Table: posts");
    });

    it("should include relationship summary for related tables", () => {
      const result = generateSchemaContext(mockSchema, ["users", "posts"]);

      expect(result).toContain("Table Relationships:");
      expect(result).toContain("posts.user_id → users.id");
    });

    it("should not include relationship summary if tables are not related", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);

      expect(result).not.toContain("Table Relationships:");
    });

    it("should handle table without comment", () => {
      const schemaWithoutComment: TableSchema[] = [
        {
          ...mockSchema[0],
          tableComment: "",
        },
      ];

      const result = generateSchemaContext(schemaWithoutComment, ["users"]);

      expect(result).toContain("Table: users\n");
      expect(result).not.toContain("Table: users ()");
    });

    it("should handle column without comment", () => {
      const result = generateSchemaContext(mockSchema, ["posts"]);

      expect(result).toContain("title: VARCHAR(255) NOT NULL");
      expect(result).not.toContain("title: VARCHAR(255) NOT NULL -");
    });
  });

  describe("generateSchemaSummary", () => {
    const mockSchema: TableSchema[] = [
      {
        tableName: "users",
        tableComment: "User accounts",
        columns: [
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
            dataType: "VARCHAR(255)",
            isNullable: "NO",
            columnKey: "UNI",
            columnDefault: null,
            columnComment: "User email address",
            extra: "",
          },
        ],
        foreignKeys: [],
        primaryKeys: ["id"],
      },
      {
        tableName: "posts",
        tableComment: "Blog posts",
        columns: [
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
            columnName: "user_id",
            dataType: "INT",
            isNullable: "NO",
            columnKey: "MUL",
            columnDefault: null,
            columnComment: "Author user ID",
            extra: "",
          },
        ],
        foreignKeys: [
          {
            columnName: "user_id",
            referencedTable: "users",
            referencedColumn: "id",
          },
        ],
        primaryKeys: ["id"],
      },
    ];

    it("should generate summary for empty schema", () => {
      const result = generateSchemaSummary([]);

      expect(result).toBe(
        "Database contains 0 tables with 0 total columns and 0 foreign key relationships."
      );
    });

    it("should generate summary with correct counts", () => {
      const result = generateSchemaSummary(mockSchema);

      expect(result).toBe(
        "Database contains 2 tables with 4 total columns and 1 foreign key relationships."
      );
    });

    it("should count all columns across tables", () => {
      const result = generateSchemaSummary(mockSchema);

      expect(result).toContain("4 total columns");
    });

    it("should count all foreign key relationships", () => {
      const result = generateSchemaSummary(mockSchema);

      expect(result).toContain("1 foreign key relationships");
    });

    it("should handle schema with no foreign keys", () => {
      const schemaNoFK: TableSchema[] = [
        {
          tableName: "users",
          tableComment: "",
          columns: [
            {
              columnName: "id",
              dataType: "INT",
              isNullable: "NO",
              columnKey: "PRI",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
          ],
          foreignKeys: [],
          primaryKeys: ["id"],
        },
      ];

      const result = generateSchemaSummary(schemaNoFK);

      expect(result).toBe(
        "Database contains 1 tables with 1 total columns and 0 foreign key relationships."
      );
    });
  });
});

