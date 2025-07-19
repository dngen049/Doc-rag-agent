import { NextResponse } from "next/server";
import { DatabaseManager } from "@/app/lib/database";
import { TableSchema } from "@/app/types/database";

export async function GET() {
  try {
    // Check if database is connected
    if (!DatabaseManager.isConnected()) {
      return NextResponse.json(
        {
          error: "No active database connection",
        },
        { status: 400 }
      );
    }

    const connection = DatabaseManager.getConnection();
    if (!connection) {
      return NextResponse.json(
        {
          error: "Database connection not available",
        },
        { status: 500 }
      );
    }

    // Get all tables
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME as tableName,
        TABLE_COMMENT as tableComment
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    // Get detailed schema information for each table
    const schemaData = await Promise.all(
      (tables as { tableName: string; tableComment: string }[]).map(
        async (table) => {
          const tableName = table.tableName;

          // Get columns for this table
          const [columns] = await connection.execute(
            `
          SELECT 
            COLUMN_NAME as columnName,
            DATA_TYPE as dataType,
            IS_NULLABLE as isNullable,
            COLUMN_KEY as columnKey,
            COLUMN_DEFAULT as columnDefault,
            COLUMN_COMMENT as columnComment,
            EXTRA as extra
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `,
            [tableName]
          );

          // Get foreign key relationships
          const [foreignKeys] = await connection.execute(
            `
          SELECT 
            COLUMN_NAME as columnName,
            REFERENCED_TABLE_NAME as referencedTable,
            REFERENCED_COLUMN_NAME as referencedColumn
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `,
            [tableName]
          );

          // Get primary keys
          const [primaryKeys] = await connection.execute(
            `
          SELECT COLUMN_NAME as columnName
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND CONSTRAINT_NAME = 'PRIMARY'
        `,
            [tableName]
          );

          return {
            tableName,
            tableComment: table.tableComment || "",
            columns: columns as TableSchema["columns"],
            foreignKeys: foreignKeys as TableSchema["foreignKeys"],
            primaryKeys: (primaryKeys as { columnName: string }[]).map(
              (pk) => pk.columnName
            ),
          };
        }
      )
    );

    return NextResponse.json({
      success: true,
      schema: schemaData,
      tableCount: schemaData.length,
    });
  } catch (error) {
    console.error("Schema discovery error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve database schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
