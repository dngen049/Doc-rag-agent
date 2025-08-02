"use client";

import { useState } from "react";
import { TableSchema, QueryResponse } from "@/app/types/database";

interface NaturalLanguageQueryProps {
  selectedTables: string[];
  schema: TableSchema[];
  onQueryComplete?: (response: QueryResponse) => void;
}

export default function NaturalLanguageQuery({
  selectedTables,
  schema,
  onQueryComplete,
}: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [readOnly, setReadOnly] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    if (selectedTables.length === 0) {
      setError("Please select at least one table");
      return;
    }

    setIsGenerating(true);
    setError("");
    setQueryResponse(null);

    try {
      const response = await fetch("/api/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          selectedTables,
          schema,
          readOnly,
          maxRows: 1000,
        }),
      });

      const data: QueryResponse = await response.json();

      if (response.ok) {
        setQueryResponse(data);
        onQueryComplete?.(data);
      } else {
        setError(data.error || "Failed to generate SQL query");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setQueryResponse(null);
    setError("");
  };

  const formatSQL = (sql: string) => {
    // Basic SQL formatting for display
    return sql
      .replace(
        /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi,
        (match) => `\n${match.toUpperCase()}`
      )
      .replace(/\b(COUNT|SUM|AVG|MAX|MIN|DISTINCT)\b/gi, (match) =>
        match.toUpperCase()
      )
      .trim();
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            💬 Natural Language Query
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>

        {!isCollapsed ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="query"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ask a question about your data
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Show me all users who signed up in the last month, or Find the top 10 products by sales"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* Query Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={readOnly}
                  onChange={(e) => setReadOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Read-only mode (safer)
                </span>
              </label>
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
                disabled={
                  isGenerating || !query.trim() || selectedTables.length === 0
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating SQL...
                  </>
                ) : (
                  "Generate SQL"
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isGenerating}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-600">
            {queryResponse ? (
              <div className="space-y-2">
                <p>✅ Query completed successfully</p>
                <p>Generated SQL: {queryResponse.sql.substring(0, 50)}...</p>
                {Array.isArray(queryResponse.results) && (
                  <p>{queryResponse.results.length} rows returned</p>
                )}
              </div>
            ) : (
              <p>Enter a natural language query to generate SQL</p>
            )}
          </div>
        )}
      </div>

      {/* Query Results */}
      {queryResponse && !isCollapsed && (
        <div className="space-y-4">
          {/* Generated SQL */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              🔍 Generated SQL Query
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto font-mono">
                {formatSQL(queryResponse.sql)}
              </pre>
            </div>
            {queryResponse.readOnly && (
              <p className="text-sm text-blue-600 mt-2">
                ℹ️ Query executed in read-only mode
              </p>
            )}
          </div>

          {/* Query Explanation  */}
          {queryResponse.explanation && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                📝 Query Explanation
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {queryResponse.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Query Results (if executed) */}
          {queryResponse.results && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                📊 Query Results
              </h4>
              <div className="text-sm text-gray-600 mb-3">
                {Array.isArray(queryResponse.results) ? (
                  <span>
                    {queryResponse.results.length} rows returned
                    {queryResponse.executionTime && (
                      <span className="ml-2">
                        (executed in {queryResponse.executionTime}ms)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Results available</span>
                )}
              </div>

              {Array.isArray(queryResponse.results) &&
                queryResponse.results.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(
                            queryResponse.results[0] as Record<string, unknown>
                          ).map((key: string) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {queryResponse.results
                          .slice(0, 10)
                          .map((row, index) => (
                            <tr key={index}>
                              {Object.values(
                                row as Record<string, unknown>
                              ).map((value, valueIndex) => (
                                <td
                                  key={valueIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {value !== null && value !== undefined
                                    ? String(value)
                                    : "NULL"}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {queryResponse.results.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing first 10 rows of {queryResponse.results.length}{" "}
                        total rows
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
