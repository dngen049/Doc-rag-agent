import mysql from "mysql2/promise";

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
}

// Global connection pool (in production, use Redis or database for persistence)
let connectionPool: mysql.Pool | null = null;

export class DatabaseManager {
  static async connect(
    config: DatabaseConfig
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Close existing connection if any
      if (connectionPool) {
        await connectionPool.end();
      }

      // Create new connection pool
      connectionPool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test the connection
      const connection = await connectionPool.getConnection();
      await connection.ping();
      connection.release();

      return {
        success: true,
        message: "Database connected successfully",
      };
    } catch (error) {
      // Clean up failed connection
      if (connectionPool) {
        try {
          await connectionPool.end();
          connectionPool = null;
        } catch (cleanupError) {
          console.error("Error cleaning up connection:", cleanupError);
        }
      }

      return {
        success: false,
        message: "Failed to connect to database",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      if (connectionPool) {
        await connectionPool.end();
        connectionPool = null;
      }

      return {
        success: true,
        message: "Database connection closed successfully",
      };
    } catch (_error) {
      return {
        success: false,
        message: "Failed to close database connection",
      };
    }
  }

  static async getStatus(): Promise<ConnectionStatus> {
    try {
      if (!connectionPool) {
        return {
          connected: false,
          message: "No active database connection",
        };
      }

      // Test if connection is still alive
      const connection = await connectionPool.getConnection();
      await connection.ping();
      connection.release();

      return {
        connected: true,
        message: "Database connection is active",
      };
    } catch (_error) {
      // Clean up dead connection
      if (connectionPool) {
        try {
          await connectionPool.end();
          connectionPool = null;
        } catch (cleanupError) {
          console.error("Error cleaning up dead connection:", cleanupError);
        }
      }

      return {
        connected: false,
        message: "Database connection is not active",
      };
    }
  }

  static getConnection(): mysql.Pool | null {
    return connectionPool;
  }

  static isConnected(): boolean {
    return connectionPool !== null;
  }
}
