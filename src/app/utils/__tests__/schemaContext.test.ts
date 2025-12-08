import { generateSchemaContext, generateSchemaSummary } from "../schemaContext";
import { TableSchema } from "@/app/types/database";

describe("schemaContext", () => {
  const mockSchema: TableSchema[] = [
    {
      tableName: "users",
      tableComment: "User accounts table",
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
          columnComment: "User email address",
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
      tableName: "orders",
      tableComment: "Customer orders",
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
          columnComment: "Foreign key to users",
          extra: "",
        },
        {
          columnName: "total",
          dataType: "decimal(10,2)",
          isNullable: "NO",
          columnKey: "",
          columnDefault: "0.00",
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
    {
      tableName: "products",
      tableComment: "",
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
          columnName: "name",
          dataType: "varchar(100)",
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

  describe("generateSchemaContext", () => {
    it("should return message when no tables are selected", () => {
      const result = generateSchemaContext(mockSchema, []);
      expect(result).toBe("No tables selected for context.");
    });

    it("should generate context for a single table without foreign keys", () => {
      const result = generateSchemaContext(mockSchema, ["products"]);
      
      expect(result).toContain("Database Schema Context:");
      expect(result).toContain("Table: products");
      expect(result).toContain("Columns:");
      expect(result).toContain("id: int (Primary Key) NOT NULL");
      expect(result).toContain("name: varchar(100) NOT NULL");
      expect(result).not.toContain("Foreign Keys:");
      expect(result).not.toContain("Table Relationships:");
    });

    it("should generate context for table with comments", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);
      
      expect(result).toContain("Table: users (User accounts table)");
      expect(result).toContain("id: int (Primary Key) NOT NULL - Primary key");
      expect(result).toContain("email: varchar(255) NOT NULL - User email address");
    });

    it("should include default values in column information", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);
      
      expect(result).toContain("created_at: timestamp DEFAULT CURRENT_TIMESTAMP");
    });

    it("should generate context for table with foreign keys", () => {
      const result = generateSchemaContext(mockSchema, ["orders"]);

      expect(result).toContain("Table: orders (Customer orders)");
      expect(result).toContain("user_id: int (Foreign Key) NOT NULL - Foreign key to users");
      expect(result).toContain("Foreign Keys:");
      expect(result).toContain("user_id → users.id");
    });

    it("should generate context for multiple tables", () => {
      const result = generateSchemaContext(mockSchema, ["users", "products"]);

      expect(result).toContain("Table: users");
      expect(result).toContain("Table: products");
      expect(result).toContain("id: int (Primary Key) NOT NULL");
    });

    it("should include table relationships when both tables are selected", () => {
      const result = generateSchemaContext(mockSchema, ["users", "orders"]);

      expect(result).toContain("Table Relationships:");
      expect(result).toContain("orders.user_id → users.id");
    });

    it("should not include relationships when referenced table is not selected", () => {
      const result = generateSchemaContext(mockSchema, ["orders"]);

      // Should have foreign keys section but not relationships section
      expect(result).toContain("Foreign Keys:");
      expect(result).not.toContain("Table Relationships:");
    });

    it("should handle tables with nullable columns", () => {
      const result = generateSchemaContext(mockSchema, ["users"]);

      // created_at is nullable, should not have NOT NULL
      expect(result).toContain("created_at: timestamp DEFAULT CURRENT_TIMESTAMP");
      expect(result).not.toContain("created_at: timestamp NOT NULL");
    });

    it("should handle all three tables with relationships", () => {
      const result = generateSchemaContext(mockSchema, ["users", "orders", "products"]);

      expect(result).toContain("Table: users");
      expect(result).toContain("Table: orders");
      expect(result).toContain("Table: products");
      expect(result).toContain("Table Relationships:");
      expect(result).toContain("orders.user_id → users.id");
    });
  });

  describe("generateSchemaSummary", () => {
    it("should generate correct summary for multiple tables", () => {
      const result = generateSchemaSummary(mockSchema);

      expect(result).toBe(
        "Database contains 3 tables with 8 total columns and 1 foreign key relationships."
      );
    });

    it("should handle empty schema", () => {
      const result = generateSchemaSummary([]);

      expect(result).toBe(
        "Database contains 0 tables with 0 total columns and 0 foreign key relationships."
      );
    });

    it("should handle single table with no relationships", () => {
      const singleTable = [mockSchema[2]]; // products table
      const result = generateSchemaSummary(singleTable);

      expect(result).toBe(
        "Database contains 1 tables with 2 total columns and 0 foreign key relationships."
      );
    });

    it("should count all columns correctly", () => {
      const twoTables = [mockSchema[0], mockSchema[1]]; // users and orders
      const result = generateSchemaSummary(twoTables);

      expect(result).toContain("6 total columns");
    });

    it("should count foreign keys correctly", () => {
      const result = generateSchemaSummary(mockSchema);

      expect(result).toContain("1 foreign key relationships");
    });
  });
});

