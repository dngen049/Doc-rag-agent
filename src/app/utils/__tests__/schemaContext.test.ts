import { generateSchemaContext, generateSchemaSummary } from "../schemaContext"
import { TableSchema } from "@/app/types/database"

describe("generateSchemaContext", () => {
  const schema: TableSchema[] = [
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
          columnComment: "primary identifier",
          extra: "auto_increment",
        },
        {
          columnName: "profile_id",
          dataType: "int",
          isNullable: "NO",
          columnKey: "MUL",
          columnDefault: null,
          columnComment: "links to profiles",
          extra: "",
        },
      ],
      foreignKeys: [
        {
          columnName: "profile_id",
          referencedTable: "profiles",
          referencedColumn: "id",
        },
      ],
      primaryKeys: ["id"],
    },
    {
      tableName: "profiles",
      tableComment: "User profiles",
      columns: [
        {
          columnName: "id",
          dataType: "int",
          isNullable: "NO",
          columnKey: "PRI",
          columnDefault: null,
          columnComment: "profile id",
          extra: "auto_increment",
        },
        {
          columnName: "display_name",
          dataType: "varchar",
          isNullable: "YES",
          columnKey: "",
          columnDefault: null,
          columnComment: "public name",
          extra: "",
        },
      ],
      foreignKeys: [],
      primaryKeys: ["id"],
    },
  ]

  it("returns default message when no tables are selected", () => {
    const context = generateSchemaContext(schema, [])
    expect(context).toBe("No tables selected for context.")
  })

  it("builds context with columns, comments, and relationships", () => {
    const context = generateSchemaContext(schema, ["users", "profiles"])

    expect(context).toContain("Database Schema Context")
    expect(context).toContain("Table: users (Application users)")
    expect(context).toContain("- id: int (Primary Key) NOT NULL - primary identifier")
    expect(context).toContain("- profile_id: int (Foreign Key) NOT NULL - links to profiles")
    expect(context).toContain("Foreign Keys:")
    expect(context).toContain("users.profile_id → profiles.id")
    expect(context).toContain("Table: profiles (User profiles)")
    expect(context).toContain("- display_name: varchar")
    expect(context).toContain("Table Relationships:")
  })
})

describe("generateSchemaSummary", () => {
  it("summarizes tables, columns, and relationships", () => {
    const summary = generateSchemaSummary([
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
    ])

    expect(summary).toBe(
      "Database contains 2 tables with 3 total columns and 1 foreign key relationships."
    )
  })
})
