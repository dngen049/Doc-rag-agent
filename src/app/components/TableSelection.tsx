"use client";

import { useState, useEffect } from "react";
import { TableSchema } from "@/app/types/database";

interface TableSelectionProps {
  onTablesSelected: (selectedTables: string[]) => void;
  onSchemaLoading: (schema: TableSchema[]) => void;
}

export default function TableSelection({
  onTablesSelected,
  onSchemaLoading,
}: TableSelectionProps) {
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchSchema();
  }, []);

  useEffect(() => {
    onTablesSelected(selectedTables);
  }, [selectedTables, onTablesSelected]);

  const fetchSchema = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/db/schema");
      const data = await response.json();

      if (response.ok) {
        setSchema(data.schema);
        onSchemaLoading(data.schema);
      } else {
        setError(data.error || "Failed to fetch schema");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSchema();
  };

  const handleTableToggle = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((name) => name !== tableName)
        : [...prev, tableName]
    );
  };

  const handleSelectAll = () => {
    // If there's a search term, select all filtered tables
    // Otherwise, select all tables
    const tablesToSelect = searchTerm
      ? filteredSchema.map((table) => table.tableName)
      : schema.map((table) => table.tableName);

    setSelectedTables(tablesToSelect);
  };

  const handleDeselectAll = () => {
    setSelectedTables([]);
  };

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  const getColumnTypeDisplay = (column: TableSchema["columns"][0]) => {
    let display = column.dataType;
    if (column.columnKey === "PRI") display += " (PK)";
    if (column.columnKey === "MUL") display += " (FK)";
    if (column.isNullable === "NO") display += " NOT NULL";
    return display;
  };

  // Filter schema based on search term
  const filteredSchema = schema.filter(
    (table) =>
      table.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.tableComment &&
        table.tableComment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading schema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={fetchSchema}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (schema.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-700 text-sm">
          No tables found in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Select Tables for AI Context
          </h3>
          <p className="text-sm text-gray-600">
            Choose which tables to include in your natural language queries
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            title="Refresh schema"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Search filter */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tables by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Selection summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-blue-700 text-sm">
          <span className="font-semibold">{selectedTables.length}</span> of{" "}
          <span className="font-semibold">{schema.length}</span> tables selected
          {searchTerm && (
            <span className="ml-2 text-blue-600">
              • Showing {filteredSchema.length} filtered results
              {filteredSchema.length > 0 && (
                <span className="ml-1">
                  (
                  {
                    filteredSchema.filter((table) =>
                      selectedTables.includes(table.tableName)
                    ).length
                  }{" "}
                  selected)
                </span>
              )}
            </span>
          )}
        </p>
      </div>

      {/* Table list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSchema.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
            <p className="mt-2 text-sm">
              {searchTerm
                ? `No tables found matching "${searchTerm}"`
                : "No tables available"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredSchema.map((table) => (
            <div
              key={table.tableName}
              className="border border-gray-200 rounded-md overflow-hidden"
            >
              {/* Table header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`table-${table.tableName}`}
                    checked={selectedTables.includes(table.tableName)}
                    onChange={() => handleTableToggle(table.tableName)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`table-${table.tableName}`}
                    className="font-medium text-gray-900 cursor-pointer"
                  >
                    {table.tableName}
                  </label>
                  {table.tableComment && (
                    <span className="text-sm text-gray-500">
                      - {table.tableComment}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {table.columns.length} columns
                  </span>
                  <button
                    onClick={() => toggleTableExpansion(table.tableName)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedTable === table.tableName ? "▼" : "▶"}
                  </button>
                </div>
              </div>

              {/* Table details (expandable) */}
              {expandedTable === table.tableName && (
                <div className="border-t border-gray-200 bg-white">
                  <div className="px-4 py-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Columns
                    </h4>
                    <div className="space-y-1">
                      {table.columns.map((column) => (
                        <div
                          key={column.columnName}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-mono text-gray-900">
                            {column.columnName}
                          </span>
                          <span className="text-gray-600">
                            {getColumnTypeDisplay(column)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Relationships */}
                    {table.foreignKeys.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Foreign Keys
                        </h4>
                        <div className="space-y-1">
                          {table.foreignKeys.map((fk, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {fk.columnName} → {fk.referencedTable}.
                              {fk.referencedColumn}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
