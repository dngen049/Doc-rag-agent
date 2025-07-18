"use client";

import { useState, useCallback } from "react";

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ["text/plain", "text/markdown", "text/x-markdown"];

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus("Error: Please upload a TXT or MD file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setUploadStatus("Error: File size must be less than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(
          `Success! Document "${file.name}" uploaded successfully.`
        );
        onUploadSuccess?.();
      } else {
        const errorData = await response.json();
        setUploadStatus(`Error: ${errorData.message || "Upload failed"}`);
      }
    } catch (error) {
      setUploadStatus("Error: Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Upload Document
      </h3>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <p className="text-sm text-gray-600">
              Drag and drop your document here, or{" "}
              <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.markdown"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports TXT and MD files (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            uploadStatus.startsWith("Error")
              ? "bg-red-100 text-red-700"
              : uploadStatus.startsWith("Success")
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {uploadStatus}
        </div>
      )}

      {isUploading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Processing...</span>
        </div>
      )}
    </div>
  );
}
