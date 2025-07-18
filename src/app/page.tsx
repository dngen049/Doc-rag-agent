import ChatWindow from "./components/ChatWindow";
import UploadForm from "./components/UploadForm";

export default function Home() {
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
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <UploadForm />
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <ChatWindow />
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
