# 🚀 Document Q&A App Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Yarn** package manager
3. **OpenAI API Key** for GPT-4 access
4. **ChromaDB** (optional - will use local instance)

## Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo>
   cd doc-chat-app
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start ChromaDB (optional):**

   ```bash
   # Install ChromaDB if not already installed
   pip install chromadb

   # Start ChromaDB server
   chroma run --host localhost --port 8000
   ```

4. **Start the development server:**

   ```bash
   yarn dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Features

### ✅ **Currently Working:**

- Upload TXT files
- Text extraction and chunking
- Vector storage in ChromaDB
- RAG-based chat with conversation memory
- Modern, responsive UI

### 🔄 **In Progress:**

- PDF and DOCX file support
- Streaming responses
- Template management

### 📋 **Usage:**

1. **Upload a document:**

   - Drag & drop or click to browse
   - Currently supports TXT files only
   - Files are automatically processed and stored

2. **Start chatting:**
   - Ask questions about your uploaded documents
   - The AI will search through your documents and provide relevant answers
   - Conversation memory is preserved across interactions

## Architecture

```
Frontend (Next.js) → API Routes → LangChain → ChromaDB
```

- **Frontend:** React components with Tailwind CSS
- **API Routes:** Next.js API endpoints for upload and chat
- **LangChain:** RAG pipeline with conversation memory
- **ChromaDB:** Vector database for document storage

## Troubleshooting

### Common Issues:

1. **"OpenAI API Key not found"**

   - Make sure you have a valid OpenAI API key in `.env.local`

2. **"ChromaDB connection failed"**

   - Start ChromaDB server: `chroma run --host localhost --port 8000`
   - Or the app will use a local instance automatically

3. **"File upload failed"**
   - Currently only TXT files are supported
   - Check file size (max 10MB)

## Next Steps

1. Add PDF and DOCX support
2. Implement streaming responses
3. Add template management
4. Deploy to production
