import { generateSchemaContext, generateSchemaSummary } from "../schemaContext";
import { TableSchema } from "@/app/types/database";

describe("schemaContext", () => {
  describe("generateSchemaContext", () => {
    it("should return message when no tables are selected", () => {
      const schema: TableSchema[] = [];
      const selectedTables: string[] = [];

      const result = generateSchemaContext(schema, selectedTables);

      expect(result).toBe("No tables selected for context.");
    });

    it("should generate context for a single table with basic columns", () => {
      const schema: TableSchema[] = [
        {
          tableName: "users",
          tableComment: "User accounts",
          columns: [
            {
              columnName: "id",
              dataType: "int",
              isNullable: "NO",
              columnKey: "PRI",
              columnDefault: null,
              columnComment: "Primary key",
              extra: "auto_increment",
            },
            {
              columnName: "email",
              dataType: "varchar(255)",
              isNullable: "NO",
              columnKey: "",
              columnDefault: null,
              columnComment: "User email",
              extra: "",
            },
          ],
          foreignKeys: [],
          primaryKeys: ["id"],
        },
      ];
      const selectedTables = ["users"];

      const result = generateSchemaContext(schema, selectedTables);

      expect(result).toContain("Database Schema Context:");
      expect(result).toContain("Table: users (User accounts)");
      expect(result).toContain("Columns:");
      expect(result).toContain("id: int (Primary Key) NOT NULL - Primary key");
      expect(result).toContain("email: varchar(255) NOT NULL - User email");
    });

    it("should include foreign key information", () => {
      const schema: TableSchema[] = [
        {
          tableName: "posts",
          tableComment: "Blog posts",
          columns: [
            {
              columnName: "id",
              dataType: "int",
              isNullable: "NO",
              columnKey: "PRI",
              columnDefault: null,
              columnComment: "",
              extra: "auto_increment",
            },
            {
              columnName: "user_id",
              dataType: "int",
              isNullable: "NO",
              columnKey: "MUL",
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
      const selectedTables = ["posts"];

      const result = generateSchemaContext(schema, selectedTables);

      expect(result).toContain("Foreign Keys:");
      expect(result).toContain("user_id → users.id");
    });

    it("should include column with default value", () => {
      const schema: TableSchema[] = [
        {
          tableName: "settings",
          tableComment: "",
          columns: [
            {
              columnName: "enabled",
              dataType: "boolean",
              isNullable: "YES",
              columnKey: "",
              columnDefault: "true",
              columnComment: "",
              extra: "",
            },
          ],
          foreignKeys: [],
          primaryKeys: [],
        },
      ];
      const selectedTables = ["settings"];

      const result = generateSchemaContext(schema, selectedTables);

      expect(result).toContain("enabled: boolean DEFAULT true");
    });

    it("should include table relationships summary", () => {
      const schema: TableSchema[] = [
        {
          tableName: "users",
          tableComment: "",
          columns: [],
          foreignKeys: [],
          primaryKeys: [],
        },
        {
          tableName: "posts",
          tableComment: "",
          columns: [],
          foreignKeys: [
            {
              columnName: "user_id",
              referencedTable: "users",
              referencedColumn: "id",
            },
          ],
          primaryKeys: [],
        },
      ];
      const selectedTables = ["users", "posts"];

      const result = generateSchemaContext(schema, selectedTables);

      expect(result).toContain("Table Relationships:");
      expect(result).toContain("posts.user_id → users.id");
    });
  });

  describe("generateSchemaSummary", () => {
    it("should generate summary for empty schema", () => {
      const schema: TableSchema[] = [];

      const result = generateSchemaSummary(schema);

      expect(result).toBe(
        "Database contains 0 tables with 0 total columns and 0 foreign key relationships."
      );
    });

    it("should generate summary with correct counts", () => {
      const schema: TableSchema[] = [
        {
          tableName: "users",
          tableComment: "",
          columns: [
            {
              columnName: "id",
              dataType: "int",
              isNullable: "NO",
              columnKey: "PRI",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
          ],
          foreignKeys: [],
          primaryKeys: [],
        },
      ];

      const result = generateSchemaSummary(schema);

      expect(result).toBe(
        "Database contains 1 tables with 1 total columns and 0 foreign key relationships."
      );
    });
  });
});

