import { TableSchema } from "@/app/types/database";

export function generateSchemaContext(
  schema: TableSchema[],
  selectedTables: string[]
): string {
  if (selectedTables.length === 0) {
    return "No tables selected for context.";
  }

  const selectedSchema = schema.filter((table) =>
    selectedTables.includes(table.tableName)
  );

  let context = "Database Schema Context:\n\n";

  // Add table information
  selectedSchema.forEach((table) => {
    context += `Table: ${table.tableName}`;
    if (table.tableComment) {
      context += ` (${table.tableComment})`;
    }
    context += "\n";

    // Add columns
    context += "Columns:\n";
    table.columns.forEach((column) => {
      let columnInfo = `  - ${column.columnName}: ${column.dataType}`;

      if (column.columnKey === "PRI") {
        columnInfo += " (Primary Key)";
      } else if (column.columnKey === "MUL") {
        columnInfo += " (Foreign Key)";
      }

      if (column.isNullable === "NO") {
        columnInfo += " NOT NULL";
      }

      if (column.columnDefault !== null) {
        columnInfo += ` DEFAULT ${column.columnDefault}`;
      }

      if (column.columnComment) {
        columnInfo += ` - ${column.columnComment}`;
      }

      context += columnInfo + "\n";
    });

    // Add foreign key relationships
    if (table.foreignKeys.length > 0) {
      context += "Foreign Keys:\n";
      table.foreignKeys.forEach((fk) => {
        context += `  - ${fk.columnName} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
      });
    }

    context += "\n";
  });

  // Add relationship summary
  const relationships = selectedSchema.flatMap((table) =>
    table.foreignKeys
      .filter((fk) => selectedTables.includes(fk.referencedTable))
      .map((fk) => ({
        from: table.tableName,
        to: fk.referencedTable,
        column: fk.columnName,
        referencedColumn: fk.referencedColumn,
      }))
  );

  if (relationships.length > 0) {
    context += "Table Relationships:\n";
    relationships.forEach((rel) => {
      context += `- ${rel.from}.${rel.column} → ${rel.to}.${rel.referencedColumn}\n`;
    });
    context += "\n";
  }

  return context;
}

export function generateSchemaSummary(schema: TableSchema[]): string {
  const tableCount = schema.length;
  const totalColumns = schema.reduce(
    (sum, table) => sum + table.columns.length,
    0
  );
  const totalRelationships = schema.reduce(
    (sum, table) => sum + table.foreignKeys.length,
    0
  );

  return `Database contains ${tableCount} tables with ${totalColumns} total columns and ${totalRelationships} foreign key relationships.`;
}
