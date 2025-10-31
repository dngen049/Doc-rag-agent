import { DatabaseManager, DatabaseConfig } from "../database";
import mysql from "mysql2/promise";

// Mock mysql2/promise
jest.mock("mysql2/promise");

describe("DatabaseManager", () => {
  let mockPool: jest.Mocked<mysql.Pool>;
  let mockConnection: jest.Mocked<mysql.PoolConnection>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock connection
    mockConnection = {
      ping: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    } as any;

    // Setup mock pool
    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection),
      end: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock createPool
    (mysql.createPool as jest.Mock).mockReturnValue(mockPool);
  });

  afterEach(async () => {
    // Clean up connection after each test
    await DatabaseManager.disconnect();
  });

  describe("connect", () => {
    it("should successfully connect to database with valid config", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      const result = await DatabaseManager.connect(config);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Database connected successfully");
      expect(mysql.createPool).toHaveBeenCalledWith({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.ping).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should handle connection errors gracefully", async () => {
      const config: DatabaseConfig = {
        host: "invalid-host",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      (mockPool.getConnection as jest.Mock).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      const result = await DatabaseManager.connect(config);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to connect to database");
      expect(result.error).toBe("Connection failed");
      expect(mockPool.end).toHaveBeenCalled();
    });

    it("should close existing connection before creating new one", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      // First connection
      await DatabaseManager.connect(config);
      expect(mockPool.end).not.toHaveBeenCalled();

      // Second connection should close the first
      await DatabaseManager.connect(config);
      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("should successfully disconnect from database", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      const result = await DatabaseManager.disconnect();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Database connection closed successfully");
      expect(mockPool.end).toHaveBeenCalled();
    });

    it("should handle disconnect when no connection exists", async () => {
      const result = await DatabaseManager.disconnect();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Database connection closed successfully");
    });

    it("should handle disconnect errors", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      (mockPool.end as jest.Mock).mockRejectedValueOnce(
        new Error("Disconnect failed")
      );

      const result = await DatabaseManager.disconnect();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to close database connection");
    });
  });

  describe("getStatus", () => {
    it("should return connected status when connection is active", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      const status = await DatabaseManager.getStatus();

      expect(status.connected).toBe(true);
      expect(status.message).toBe("Database connection is active");
    });

    it("should return disconnected status when no connection exists", async () => {
      const status = await DatabaseManager.getStatus();

      expect(status.connected).toBe(false);
      expect(status.message).toBe("No active database connection");
    });

    it("should handle connection ping errors", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      (mockConnection.ping as jest.Mock).mockRejectedValueOnce(
        new Error("Ping failed")
      );

      const status = await DatabaseManager.getStatus();

      expect(status.connected).toBe(false);
      expect(status.message).toBe("Database connection is not active");
    });
  });

  describe("getConnection", () => {
    it("should return null when no connection exists", () => {
      const connection = DatabaseManager.getConnection();
      expect(connection).toBeNull();
    });

    it("should return connection pool when connected", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      const connection = DatabaseManager.getConnection();

      expect(connection).toBe(mockPool);
    });
  });

  describe("isConnected", () => {
    it("should return false when no connection exists", () => {
      const isConnected = DatabaseManager.isConnected();
      expect(isConnected).toBe(false);
    });

    it("should return true when connected", async () => {
      const config: DatabaseConfig = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "testdb",
      };

      await DatabaseManager.connect(config);
      const isConnected = DatabaseManager.isConnected();

      expect(isConnected).toBe(true);
    });
  });
});
