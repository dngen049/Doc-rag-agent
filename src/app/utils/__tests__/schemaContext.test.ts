import {
  generateSchemaContext,
  generateSchemaSummary,
} from "@/app/utils/schemaContext";
import { TableSchema } from "@/app/types/database";

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
        columnName: "role",
        dataType: "varchar(50)",
        isNullable: "YES",
        columnKey: "",
        columnDefault: "'member'",
        columnComment: "Role assigned to the user",
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
        columnName: "display_name",
        dataType: "varchar(100)",
        isNullable: "NO",
        columnKey: "",
        columnDefault: null,
        columnComment: "Name shown publicly",
        extra: "",
      },
    ],
    foreignKeys: [],
    primaryKeys: ["id"],
  },
];

describe("schemaContext utils", () => {
  describe("generateSchemaContext", () => {
    it("returns a helpful fallback when no tables are selected", () => {
      const context = generateSchemaContext(mockSchema, []);
      expect(context).toBe("No tables selected for context.");
    });

    it("includes table, column, and relationship details for selected tables", () => {
      const context = generateSchemaContext(mockSchema, ["users", "profiles"]);

      expect(context).toContain("Table: users (Application users)");
      expect(context).toContain("- id: int (Primary Key) NOT NULL");
      expect(context).toContain("DEFAULT 'member'");
      expect(context).toContain("Foreign Keys:");
      expect(context).toContain("profile_id → profiles.id");
      expect(context).toContain("Table Relationships:");
      expect(context).toContain("- users.profile_id → profiles.id");
    });
  });

  describe("generateSchemaSummary", () => {
    it("summarizes table, column, and relationship counts", () => {
      const summary = generateSchemaSummary(mockSchema);
      expect(summary).toBe(
        "Database contains 2 tables with 4 total columns and 1 foreign key relationships."
      );
    });
  });
});
