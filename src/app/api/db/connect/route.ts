import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager, DatabaseConfig } from "@/app/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, database, username, password } = body;

    // Validate required fields
    if (!host || !database || !username || !password) {
      return NextResponse.json(
        {
          error: "Missing required fields: host, database, username, password",
        },
        { status: 400 }
      );
    }

    // Create database config
    const config: DatabaseConfig = {
      host,
      port: parseInt(port) || 3306,
      user: username,
      password,
      database,
    };

    // Connect using DatabaseManager
    const result = await DatabaseManager.connect(config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        connectionInfo: {
          host,
          port: config.port,
          database,
          username,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: result.message,
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        error: "Failed to connect to database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await DatabaseManager.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Connection status check error:", error);
    return NextResponse.json({
      connected: false,
      message: "Error checking connection status",
    });
  }
}

export async function DELETE() {
  try {
    const result = await DatabaseManager.disconnect();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
    return NextResponse.json(
      { error: "Failed to close database connection" },
      { status: 500 }
    );
  }
}
