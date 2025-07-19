# 📘 Iteration Spec – Document Q&A App (LangChain + Next.js)

---

## 🏷 Overview

This project is a web app where users can:

✅ Upload documents (PDF, DOCX, TXT)  
✅ Ask questions about uploaded content using ChatGPT (via LangChain)  
✅ Preserve conversation memory across interactions  
✅ Create and reuse "templates" (custom system prompts for different use cases)

The app is built entirely with **Next.js (frontend + API routes)**, using **LangChain** for document processing and **ChromaDB** (local) as the vector store.

---

## 🚀 Iteration Roadmap

---

### 🌱 **Iteration 1 – MVP: Upload & Chat**

**Goal:**  
Enable uploading documents and chatting with memory (single user, no auth).

**Features:**

- [x] Document Upload API
  - POST `/api/upload`
  - Accept PDF, DOCX, TXT
  - Extract text and split into chunks
  - Generate embeddings (OpenAI)
  - Store vectors in ChromaDB (local)
- [x] Chat API
  - POST `/api/chat`
  - Accept user message
  - Retrieve relevant document chunks via vector search
  - Combine retrieved context with LangChain conversation memory
  - Respond with GPT-generated answer
- [x] Frontend UI
  - Upload form
  - Simple chat interface with streaming responses

**Outcome:**  
Single user can upload a doc and ask questions in a session with memory.

---

### 🌿 **Iteration 2 – Templates**

**Goal:**  
Allow users to create and manage reusable prompt templates.

**Features:**

- [] Templates API
  - GET `/api/templates` – List templates
  - POST `/api/templates` – Create new template
  - Templates include:
    - Template name
    - System prompt
    - Config (e.g., chunk size, model)
- [] Frontend UI
  - Template management page
  - Select a template before starting a chat
- [] Templates stored in memory (or JSON file for now)

**Outcome:**  
User can select from saved templates to guide the assistant’s behavior.

---

### 🌳 **Iteration 3 – Multi-Document Chat**

**Goal:**  
Support querying multiple uploaded documents simultaneously.

**Features:**

- [x] Allow selecting multiple documents for a chat session
- [x] Retrieve context across all selected docs
- [x] Show which document each answer snippet comes from

**Outcome:**  
User can chat across multiple docs in one session.

---

### 🌴 **Iteration 4 – UX & Scalability**

**Goal:**  
Polish UI/UX and prepare for scaling.

**Features:**

- [] Stream chat responses (token-by-token)
- [] Support large files (>100MB) with background processing
- [] Dockerize app for deployment
- [] Replace ChromaDB with Pinecone (optional)
- [] Move file storage to AWS S3 (optional)

**Outcome:**  
Production-ready app with improved UX and scalability.

---

### 🌐 **Iteration 5 – Web Scraping**

**Goal:**  
Enable users to scrape and analyze web content directly within the app.

**Features:**

- [x] Web Scraping API
  - POST `/api/scrape` – Scrape content from URLs
  - Accept single URL or list of URLs
  - Extract text content, metadata, and links
  - Handle different content types (articles, blogs, documentation)
  - Rate limiting and respectful crawling
- [x] Web Content Processing
  - Clean and structure scraped content
  - Split into chunks for vector storage
  - Generate embeddings for web content
  - Store in same ChromaDB with document type tagging
- [x] Frontend UI
  - URL input form for web scraping
  - Progress indicators for scraping operations
  - Display scraped content preview
  - Option to combine web content with uploaded documents
- [x] Enhanced Chat
  - Query across both uploaded documents and scraped web content
  - Source attribution for web content responses
  - Filter responses by content type (documents vs web)

**Outcome:**  
Users can scrape web content and chat about it alongside their uploaded documents.

---

### 🗄️ **Iteration 6 – Database Query**

**Goal:**  
Enable users to query databases directly and use LLM to answer questions about the data.

**Features:**

- [] Database Connection API
  - POST `/api/db/connect` – Establish database connection
  - Support for MySQL database
  - Connection pooling and security
  - Connection status monitoring
- [] Database Query API
  - POST `/api/db/query` – Execute natural language queries
  - Convert natural language to SQL using LLM
  - Execute SQL queries safely with parameterization
  - Return structured results with metadata
- [] Database Schema Analysis
  - GET `/api/db/schema` – Retrieve database schema
  - Table and column information
  - Foreign key relationships
  - Data types and constraints
- [] Frontend UI
  - Separate database query page (`/db-query`)
  - Database connection form
  - Table selection interface (multi-select)
  - Natural language query input
  - Results display with data visualization
  - Query history and saved queries
  - Schema browser/explorer
- [] Enhanced LLM Integration
  - Use selected table schemas as context for query generation
  - Limit query scope to selected tables only
  - Explain query results in natural language
  - Suggest follow-up questions based on data
  - Generate insights and patterns from query results
- [] Security & Safety
  - Query validation and sanitization
  - Read-only mode option
  - Query execution limits
  - Connection timeout handling

**Outcome:**  
Users can connect to databases, ask questions in natural language, and get AI-powered insights from their data.

---

## 🛠 Tech Stack

| Layer        | Technology                |
| ------------ | ------------------------- |
| Frontend     | Next.js (App Router)      |
| Styling      | Tailwind CSS              |
| Backend      | Next.js API Routes        |
| LangChain    | RAG + Conversation Memory |
| Vector DB    | ChromaDB (local)          |
| File Storage | Local (dev) / S3 (prod)   |
| LLM          | OpenAI GPT-4              |

---

## 📂 Folder Structure

/app
/api
/upload <-- POST: upload files
/chat <-- POST: send/receive chat
/templates <-- GET/POST: manage templates
/chat <-- Chat UI
/templates <-- Manage templates
/components
ChatWindow.tsx
UploadForm.tsx
TemplateForm.tsx
/lib
langchain.ts <-- RAG pipeline & memory
vectordb.ts <-- ChromaDB wrapper
/utils
textExtract.ts <-- PDF/DOCX/TXT extraction
