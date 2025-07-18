"use client";

import { useState, useEffect } from "react";

interface UploadedFile {
  filename: string;
  chunks: number;
  uploadedAt?: string;
}

interface UploadedFilesProps {
  onFileSelect?: (filename: string) => void;
  refreshTrigger?: number;
}

export default function UploadedFiles({
  onFileSelect,
  refreshTrigger,
}: UploadedFilesProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        setError("Failed to fetch uploaded files");
      }
    } catch (error) {
      setError("Error loading uploaded files");
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) => {
    try {
      return (
        new Date(dateString).toLocaleDateString() +
        " " +
        new Date(dateString).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return "Unknown date";
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "txt":
        return "📄";
      case "md":
      case "markdown":
        return "📝";
      default:
        return "📁";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Uploaded Files
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Uploaded Files
        </h3>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchFiles}
            className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Uploaded Files ({files.length})
      </h3>

      {files.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-2">📁</div>
          <p className="text-gray-500 text-sm">No files uploaded yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Upload a document to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                onFileSelect
                  ? "hover:bg-gray-50 border-gray-200"
                  : "border-gray-200"
              }`}
              onClick={() => onFileSelect?.(file.filename)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file.filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {file.filename}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {file.chunks} chunk{file.chunks !== 1 ? "s" : ""}
                      </span>
                      {file.uploadedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(file.uploadedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {onFileSelect && (
                  <button className="text-blue-500 hover:text-blue-600 text-xs">
                    Select
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={fetchFiles}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
