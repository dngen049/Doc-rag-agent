import { generateSchemaContext, generateSchemaSummary } from "@/app/utils/schemaContext";
import { TableSchema } from "@/app/types/database";

const mockSchema: TableSchema[] = [
  {
    tableName: "users",
    tableComment: "Stores user profiles",
    columns: [
      {
        columnName: "id",
        dataType: "int",
        isNullable: "NO",
        columnKey: "PRI",
        columnDefault: null,
        columnComment: "Primary identifier",
        extra: "",
      },
      {
        columnName: "email",
        dataType: "varchar(255)",
        isNullable: "NO",
        columnKey: "",
        columnDefault: null,
        columnComment: "Unique email",
        extra: "",
      },
    ],
    foreignKeys: [],
    primaryKeys: ["id"],
  },
  {
    tableName: "orders",
    tableComment: "Tracks purchases",
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
        columnComment: "References users.id",
        extra: "",
      },
      {
        columnName: "status",
        dataType: "varchar(50)",
        isNullable: "YES",
        columnKey: "",
        columnDefault: "pending",
        columnComment: "Order state",
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

describe("schemaContext utilities", () => {
  describe("generateSchemaContext", () => {
    it("returns a helpful message when no tables are selected", () => {
      const context = generateSchemaContext(mockSchema, []);

      expect(context).toBe("No tables selected for context.");
    });

    it("includes table details, columns, and relationships for selected tables", () => {
      const context = generateSchemaContext(mockSchema, ["users", "orders"]);

      expect(context).toContain("Table: users (Stores user profiles)");
      expect(context).toContain("- id: int (Primary Key) NOT NULL");
      expect(context).toContain("- user_id: int (Foreign Key) NOT NULL");
      expect(context).toContain("DEFAULT pending - Order state");
      expect(context).toContain("Table Relationships:");
      expect(context).toContain("- orders.user_id → users.id");
    });
  });

  describe("generateSchemaSummary", () => {
    it("summarizes total tables, columns, and foreign keys", () => {
      const summary = generateSchemaSummary(mockSchema);

      expect(summary).toBe(
        "Database contains 2 tables with 5 total columns and 1 foreign key relationships."
      );
    });
  });
});
