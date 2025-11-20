import { TableSchema } from "@/app/types/database"
import {
  generateSchemaContext,
  generateSchemaSummary,
} from "@/app/utils/schemaContext"

const mockSchema: TableSchema[] = [
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
        dataType: "int",
        isNullable: "NO",
        columnKey: "PRI",
        columnDefault: null,
        columnComment: "Post identifier",
        extra: "",
      },
      {
        columnName: "user_id",
        dataType: "int",
        isNullable: "NO",
        columnKey: "MUL",
        columnDefault: null,
        columnComment: "Author reference",
        extra: "",
      },
      {
        columnName: "title",
        dataType: "varchar(255)",
        isNullable: "NO",
        columnKey: "",
        columnDefault: null,
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
]

describe("schemaContext utilities", () => {
  describe("generateSchemaContext", () => {
    it("returns a friendly message when no tables are selected", () => {
      const context = generateSchemaContext(mockSchema, [])

      expect(context).toBe("No tables selected for context.")
    })

    it("includes table details, columns, and relationships", () => {
      const context = generateSchemaContext(mockSchema, ["users", "posts"])

      expect(context).toContain("Database Schema Context")
      expect(context).toContain("Table: users (Application users)")
      expect(context).toContain("Table: posts (Blog posts)")
      expect(context).toContain("- id: int (Primary Key) NOT NULL")
      expect(context).toContain("- user_id: int (Foreign Key) NOT NULL")
      expect(context).toContain("Foreign Keys:\n  - user_id → users.id")
      expect(context).toContain("Table Relationships:\n- posts.user_id → users.id")
    })
  })

  describe("generateSchemaSummary", () => {
    it("summarizes columns and relationships across the schema", () => {
      const summary = generateSchemaSummary(mockSchema)

      expect(summary).toBe(
        "Database contains 2 tables with 5 total columns and 1 foreign key relationships."
      )
    })
  })
})
