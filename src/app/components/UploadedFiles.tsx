"use client";

import { useState, useEffect } from "react";

interface UploadedFile {
  filename: string;
  chunks: number;
  uploadedAt?: string;
}

interface UploadedFilesProps {
  onFileSelect?: (filename: string) => void;
  onMultiSelect?: (filenames: string[]) => void;
  selectedFiles?: string[];
  refreshTrigger?: number;
  multiSelectMode?: boolean;
}

export default function UploadedFiles({
  onFileSelect,
  onMultiSelect,
  selectedFiles = [],
  refreshTrigger,
  multiSelectMode = false,
}: UploadedFilesProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [selectedFileSet, setSelectedFileSet] = useState<Set<string>>(
    new Set(selectedFiles)
  );

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

  useEffect(() => {
    setSelectedFileSet(new Set(selectedFiles));
  }, [selectedFiles]);

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

  const handleDeleteFile = async (filename: string) => {
    if (deletingFiles.has(filename)) return;

    try {
      setDeletingFiles((prev) => new Set(prev).add(filename));

      const response = await fetch(
        `/api/files/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove the file from the local state
        setFiles((prev) => prev.filter((file) => file.filename !== filename));
        // Remove from selected files if it was selected
        setSelectedFileSet((prev) => {
          const newSet = new Set(prev);
          newSet.delete(filename);
          return newSet;
        });
        onMultiSelect?.(
          Array.from(selectedFileSet).filter((f) => f !== filename)
        );
      } else {
        const errorData = await response.json();
        setError(
          `Failed to delete file: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      setError("Error deleting file");
      console.error("Error deleting file:", error);
    } finally {
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
  };

  const handleFileToggle = (filename: string) => {
    if (multiSelectMode) {
      const newSelectedSet = new Set(selectedFileSet);
      if (newSelectedSet.has(filename)) {
        newSelectedSet.delete(filename);
      } else {
        newSelectedSet.add(filename);
      }
      setSelectedFileSet(newSelectedSet);
      onMultiSelect?.(Array.from(newSelectedSet));
    } else {
      onFileSelect?.(filename);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
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
    <div>
      <div className="text-sm text-gray-600 mb-4">
        {files.length} file{files.length !== 1 ? "s" : ""} uploaded
      </div>

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
                multiSelectMode && selectedFileSet.has(file.filename)
                  ? "bg-blue-50 border-blue-300"
                  : onFileSelect
                  ? "hover:bg-gray-50 border-gray-200"
                  : "border-gray-200"
              }`}
              onClick={() => handleFileToggle(file.filename)}
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
                <div className="flex items-center space-x-2">
                  {multiSelectMode && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFileSet.has(file.filename)}
                        onChange={() => handleFileToggle(file.filename)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  )}
                  {onFileSelect && !multiSelectMode && (
                    <button className="text-blue-500 hover:text-blue-600 text-xs">
                      Select
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.filename);
                    }}
                    disabled={deletingFiles.has(file.filename)}
                    className={`text-xs transition-colors ${
                      deletingFiles.has(file.filename)
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600"
                    }`}
                  >
                    {deletingFiles.has(file.filename)
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
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
