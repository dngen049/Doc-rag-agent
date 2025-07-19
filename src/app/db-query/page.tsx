"use client";

import { useState, useEffect } from "react";
import {
  DatabaseConnectionForm,
  DatabaseConnectionStatus,
} from "@/app/types/database";

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

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

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
    } catch (error) {
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
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
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

          {/* Next Steps */}
          {connectionStatus.connected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ✅ Connected Successfully!
              </h3>
              <p className="text-blue-700 mb-3">
                Your database connection is active. In the next phase,
                you&apos;ll be able to:
              </p>
              <ul className="text-blue-700 space-y-1">
                <li>• Explore your database schema</li>
                <li>• Select tables for AI context</li>
                <li>• Query your data using natural language</li>
                <li>• View and visualize results</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
