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
          {
            columnName: "created_at",
            dataType: "timestamp",
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
            columnComment: "Author",
            extra: "",
          },
          {
            columnName: "title",
            dataType: "varchar(255)",
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

    it("should return message when no tables are selected", () => {
      const result = generateSchemaContext(mockSchema, []);
      expect(result).toBe("No tables selected for context.");
    });

    it("should generate context for a single table", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);
      
      expect(result).toContain("Database Schema Context:");
      expect(result).toContain("Table: users (User accounts)");
      expect(result).toContain("Columns:");
      expect(result).toContain("id: int (Primary Key) NOT NULL - Primary key");
      expect(result).toContain("email: varchar(255) NOT NULL - User email");
      expect(result).toContain("created_at: timestamp DEFAULT CURRENT_TIMESTAMP");
    });

    it("should generate context for multiple tables", () => {
      const result = generateSchemaContext(mockSchema, ["users", "posts"]);
      
      expect(result).toContain("Table: users");
      expect(result).toContain("Table: posts");
    });

    it("should include foreign key information", () => {
      const result = generateSchemaContext(mockSchema, ["posts"]);
      
      expect(result).toContain("Foreign Keys:");
      expect(result).toContain("user_id → users.id");
    });

    it("should include table relationships when both tables are selected", () => {
      const result = generateSchemaContext(mockSchema, ["users", "posts"]);
      
      expect(result).toContain("Table Relationships:");
      expect(result).toContain("posts.user_id → users.id");
    });

    it("should not include relationships when referenced table is not selected", () => {
      const result = generateSchemaContext(mockSchema, ["posts"]);
      
      expect(result).not.toContain("Table Relationships:");
    });

    it("should handle tables without comments", () => {
      const schemaWithoutComments: TableSchema[] = [
        {
          tableName: "test_table",
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
          primaryKeys: ["id"],
        },
      ];

      const result = generateSchemaContext(schemaWithoutComments, ["test_table"]);
      
      expect(result).toContain("Table: test_table\n");
      expect(result).not.toContain("()");
    });
  });

  describe("generateSchemaSummary", () => {
    it("should generate summary for empty schema", () => {
      const result = generateSchemaSummary([]);
      expect(result).toBe("Database contains 0 tables with 0 total columns and 0 foreign key relationships.");
    });

    it("should generate summary for single table", () => {
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
            {
              columnName: "email",
              dataType: "varchar(255)",
              isNullable: "NO",
              columnKey: "",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
          ],
          foreignKeys: [],
          primaryKeys: ["id"],
        },
      ];

      const result = generateSchemaSummary(schema);
      expect(result).toBe("Database contains 1 tables with 2 total columns and 0 foreign key relationships.");
    });

    it("should generate summary for multiple tables with relationships", () => {
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
          primaryKeys: ["id"],
        },
        {
          tableName: "posts",
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

      const result = generateSchemaSummary(schema);
      expect(result).toBe("Database contains 2 tables with 3 total columns and 1 foreign key relationships.");
    });

    it("should count all columns and relationships correctly", () => {
      const schema: TableSchema[] = [
        {
          tableName: "table1",
          tableComment: "",
          columns: [
            {
              columnName: "col1",
              dataType: "int",
              isNullable: "NO",
              columnKey: "",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
            {
              columnName: "col2",
              dataType: "varchar(255)",
              isNullable: "NO",
              columnKey: "",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
            {
              columnName: "col3",
              dataType: "text",
              isNullable: "YES",
              columnKey: "",
              columnDefault: null,
              columnComment: "",
              extra: "",
            },
          ],
          foreignKeys: [
            {
              columnName: "fk1",
              referencedTable: "table2",
              referencedColumn: "id",
            },
            {
              columnName: "fk2",
              referencedTable: "table3",
              referencedColumn: "id",
            },
          ],
          primaryKeys: ["col1"],
        },
      ];

      const result = generateSchemaSummary(schema);
      expect(result).toBe("Database contains 1 tables with 3 total columns and 2 foreign key relationships.");
    });
  });
});
