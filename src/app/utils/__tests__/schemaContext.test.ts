import { TableSchema } from "@/app/types/database";
import {
  generateSchemaContext,
  generateSchemaSummary,
} from "../schemaContext";

const sampleSchema: TableSchema[] = [
  {
    tableName: "users",
    tableComment: "Application users",
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
        columnComment: "Unique email address",
        extra: "",
      },
    ],
    foreignKeys: [],
    primaryKeys: ["id"],
  },
  {
    tableName: "posts",
    tableComment: "Authored blog posts",
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
        columnComment: "Links to users",
        extra: "",
      },
      {
        columnName: "title",
        dataType: "varchar(255)",
        isNullable: "NO",
        columnKey: "",
        columnDefault: "Untitled",
        columnComment: "Post title",
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

describe("generateSchemaContext", () => {
  it("returns a helpful fallback when no tables are selected", () => {
    const context = generateSchemaContext(sampleSchema, []);
    expect(context).toBe("No tables selected for context.");
  });

  it("includes table details, column metadata, and relationship summary", () => {
    const context = generateSchemaContext(sampleSchema, ["users", "posts"]);

    expect(context).toContain("Database Schema Context:");
    expect(context).toContain("Table: users (Application users)");
    expect(context).toContain("- id: int (Primary Key) NOT NULL");
    expect(context).toContain("DEFAULT Untitled - Post title");

    // Relationship summary should reference both tables
    expect(context).toContain("Table Relationships:");
    expect(context).toContain("- posts.user_id → users.id");
  });
});

describe("generateSchemaSummary", () => {
  it("summarizes table, column, and relationship counts", () => {
    const summary = generateSchemaSummary(sampleSchema);
    expect(summary).toBe(
      "Database contains 2 tables with 5 total columns and 1 foreign key relationships."
    );
  });
});
