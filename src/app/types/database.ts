export interface DatabaseConnectionForm {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export interface DatabaseConnectionStatus {
  connected: boolean;
  message: string;
}

export interface DatabaseConnectionResponse {
  success: boolean;
  message: string;
  connectionInfo?: {
    host: string;
    port: number;
    database: string;
    username: string;
  };
  error?: string;
  details?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

// Schema Discovery Types
export interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnKey: string;
  columnDefault: string | null;
  columnComment: string;
  extra: string;
}

export interface ForeignKey {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableSchema {
  tableName: string;
  tableComment: string;
  columns: TableColumn[];
  foreignKeys: ForeignKey[];
  primaryKeys: string[];
}

export interface SchemaResponse {
  success: boolean;
  schema: TableSchema[];
  tableCount: number;
  error?: string;
  details?: string;
}

// Query Generation Types
export interface QueryRequest {
  query: string;
  selectedTables: string[];
  schema: TableSchema[];
  readOnly?: boolean;
  maxRows?: number;
}

export interface QueryResponse {
  success: boolean;
  query: string;
  sql: string;
  explanation: string;
  results?: unknown;
  executionTime?: number;
  readOnly: boolean;
  selectedTables: string[];
  error?: string;
  details?: string;
}
