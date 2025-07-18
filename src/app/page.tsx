"use client";

import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import UploadForm from "./components/UploadForm";
import UploadedFiles from "./components/UploadedFiles";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const handleUploadSuccess = () => {
    // Trigger a refresh of the uploaded files list
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMultiSelect = (filenames: string[]) => {
    setSelectedDocuments(filenames);
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    if (!multiSelectMode) {
      setSelectedDocuments([]);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Q&A Chat
          </h1>
          <p className="text-gray-600">
            Upload your documents and ask questions about their content
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Files */}
          <div className="lg:col-span-1 space-y-6">
            <UploadForm onUploadSuccess={handleUploadSuccess} />
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Document Selection
                </h3>
                <button
                  onClick={toggleMultiSelectMode}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    multiSelectMode
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {multiSelectMode ? "Multi-Select" : "Single-Select"}
                </button>
              </div>
              <UploadedFiles
                refreshTrigger={refreshTrigger}
                multiSelectMode={multiSelectMode}
                selectedFiles={selectedDocuments}
                onMultiSelect={handleMultiSelect}
              />
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <ChatWindow selectedDocuments={selectedDocuments} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Built with Next.js, LangChain, and ChromaDB</p>
        </div>
      </div>
    </div>
  );
}
