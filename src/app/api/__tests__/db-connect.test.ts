import { POST, GET, DELETE } from "../db/connect/route";
import { NextRequest } from "next/server";
import { DatabaseManager } from "../../lib/database";

jest.mock("../../lib/database");

describe("Database Connect API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/db/connect", () => {
    it("should successfully connect to database", async () => {
      (DatabaseManager.connect as jest.Mock).mockResolvedValue({
        success: true,
        message: "Database connected successfully",
      });

      const request = new NextRequest("http://localhost:3000/api/db/connect", {
        method: "POST",
        body: JSON.stringify({
          host: "localhost",
          port: "3306",
          database: "testdb",
          username: "root",
          password: "password",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.connectionInfo.host).toBe("localhost");
      expect(data.connectionInfo.database).toBe("testdb");
    });

    it("should return 400 error when required fields are missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/db/connect", {
        method: "POST",
        body: JSON.stringify({
          host: "localhost",
          database: "testdb",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    });

    it("should handle connection failures", async () => {
      (DatabaseManager.connect as jest.Mock).mockResolvedValue({
        success: false,
        message: "Connection failed",
        error: "Invalid credentials",
      });

      const request = new NextRequest("http://localhost:3000/api/db/connect", {
        method: "POST",
        body: JSON.stringify({
          host: "localhost",
          port: "3306",
          database: "testdb",
          username: "root",
          password: "wrong",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Connection failed");
    });

    it("should use default port when not provided", async () => {
      (DatabaseManager.connect as jest.Mock).mockResolvedValue({
        success: true,
        message: "Database connected successfully",
      });

      const request = new NextRequest("http://localhost:3000/api/db/connect", {
        method: "POST",
        body: JSON.stringify({
          host: "localhost",
          database: "testdb",
          username: "root",
          password: "password",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connectionInfo.port).toBe(3306);
    });

    it("should handle JSON parsing errors", async () => {
      const request = new NextRequest("http://localhost:3000/api/db/connect", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to connect to database");
    });
  });

  describe("GET /api/db/connect", () => {
    it("should return connection status when connected", async () => {
      (DatabaseManager.getStatus as jest.Mock).mockResolvedValue({
        connected: true,
        message: "Database connection is active",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(true);
    });

    it("should return disconnected status when not connected", async () => {
      (DatabaseManager.getStatus as jest.Mock).mockResolvedValue({
        connected: false,
        message: "No active database connection",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(false);
    });

    it("should handle status check errors", async () => {
      (DatabaseManager.getStatus as jest.Mock).mockRejectedValue(
        new Error("Status check failed")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connected).toBe(false);
    });
  });

  describe("DELETE /api/db/connect", () => {
    it("should successfully disconnect from database", async () => {
      (DatabaseManager.disconnect as jest.Mock).mockResolvedValue({
        success: true,
        message: "Database connection closed successfully",
      });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("closed successfully");
    });

    it("should handle disconnect errors", async () => {
      (DatabaseManager.disconnect as jest.Mock).mockResolvedValue({
        success: false,
        message: "Failed to close connection",
      });

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to close connection");
    });

    it("should handle unexpected errors during disconnect", async () => {
      (DatabaseManager.disconnect as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to close database connection");
    });
  });
});

