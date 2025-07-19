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
