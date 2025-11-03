"use client";

import { useState, useEffect } from "react";
import {
  DatabaseConnectionForm,
  DatabaseConnectionStatus,
  TableSchema,
  QueryResponse,
} from "@/app/types/database";
import TableSelection from "@/app/components/TableSelection";
import NaturalLanguageQuery from "@/app/components/NaturalLanguageQuery";
import {
  generateSchemaContext,
} from "@/app/utils/schemaContext";

export default function DatabaseQueryPage() {
  const [formData, setFormData] = useState<DatabaseConnectionForm>({
    host: "localhost",
    port: "3306",
    database: "",
    username: "",
    password: "",
  });

  const [connectionStatus, setConnectionStatus] =
    useState<DatabaseConnectionStatus>({
      connected: false,
      message: "Not connected",
    });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>("");

  // Phase 2: Schema and table selection state
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [schemaContext, setSchemaContext] = useState<string>("");

  // Phase 3: Query state
  const [, setLastQueryResponse] =
    useState<QueryResponse | null>(null);
  const [isSchemaContextCollapsed, setIsSchemaContextCollapsed] =
    useState<boolean>(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Update schema context when selected tables change
  useEffect(() => {
    if (schema.length > 0 && selectedTables.length > 0) {
      const context = generateSchemaContext(schema, selectedTables);
      setSchemaContext(context);
    } else {
      setSchemaContext("");
    }
  }, [schema, selectedTables]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("/api/db/connect");
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: DatabaseConnectionForm) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user starts typing
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError("");

    try {
      const response = await fetch("/api/db/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus({
          connected: true,
          message: data.message,
        });
      } else {
        setError(data.error || "Failed to connect to database");
        setConnectionStatus({
          connected: false,
          message: "Connection failed",
        });
      }
    } catch (_error) {
      setError("Network error occurred");
      setConnectionStatus({
        connected: false,
        message: "Connection failed",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/db/connect", {
        method: "DELETE",
      });

      if (response.ok) {
        setConnectionStatus({
          connected: false,
          message: "Disconnected",
        });
        // Clear schema data when disconnecting
        setSchema([]);
        setSelectedTables([]);
        setSchemaContext("");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const handleTablesSelected = (tables: string[]) => {
    setSelectedTables(tables);
  };

  const handleSchemaLoading = (schema: TableSchema[]) => {
    console.log("Schema loaded:", schema);
    setSchema(schema);
  };

  const handleQueryComplete = (response: QueryResponse) => {
    setLastQueryResponse(response);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🗄️ Database Query
            </h1>
            <p className="text-gray-600">
              Connect to your MySQL database and query it using natural language
            </p>
          </div>

          {/* Connection Status */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus.connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {connectionStatus.message}
              </span>
            </div>
          </div>

          {/* Connection Form or Connected Database Info */}
          {!connectionStatus.connected ? (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Database Connection
              </h2>

              <form onSubmit={handleConnect} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="host"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Host
                    </label>
                    <input
                      type="text"
                      id="host"
                      name="host"
                      value={formData.host}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="localhost"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="port"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Port
                    </label>
                    <input
                      type="text"
                      id="port"
                      name="port"
                      value={formData.port}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="3306"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="database"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Database Name
                    </label>
                    <input
                      type="text"
                      id="database"
                      name="database"
                      value={formData.database}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="your_database"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="your_username"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="your_password"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-green-900 mb-2">
                    Connected to Database
                  </h2>
                  <p className="text-green-700">
                    Database:{" "}
                    <span className="font-mono font-semibold">
                      {formData.database}
                    </span>
                  </p>
                  <p className="text-green-600 text-sm">
                    Host: {formData.host}:{formData.port}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Schema Discovery & Table Selection */}
          {connectionStatus.connected && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🗂️ Schema Discovery & Table Selection
              </h2>

              <TableSelection
                onTablesSelected={handleTablesSelected}
                onSchemaLoading={handleSchemaLoading}
              />

              {/* Schema Context Preview */}
              {schemaContext && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Generated Schema Context
                    </h3>
                    <button
                      onClick={() =>
                        setIsSchemaContextCollapsed(!isSchemaContextCollapsed)
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title={isSchemaContextCollapsed ? "Expand" : "Collapse"}
                    >
                      {isSchemaContextCollapsed ? "▼" : "▲"}
                    </button>
                  </div>

                  {!isSchemaContextCollapsed ? (
                    <>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {schemaContext}
                        </pre>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        This context will be provided to the AI for generating
                        accurate SQL queries.
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p>Schema context is available for AI query generation</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTables.length} tables selected • Click to
                        expand
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {connectionStatus.connected &&
            selectedTables.length > 0 &&
            schema.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🤖 Natural Language to SQL Conversion
                </h2>

                <NaturalLanguageQuery
                  selectedTables={selectedTables}
                  schema={schema}
                  onQueryComplete={handleQueryComplete}
                />
              </div>
            )}

          {/* Next Steps */}
          {connectionStatus.connected && selectedTables.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Phase 3 Complete!
              </h3>
              <p className="text-green-700 mb-3">
                Natural language to SQL conversion is now active! You can:
              </p>
              <ul className="text-green-700 space-y-1">
                <li>• Ask questions in plain English</li>
                <li>• Get AI-generated SQL queries</li>
                <li>• View query explanations</li>
                <li>• Execute queries safely</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
