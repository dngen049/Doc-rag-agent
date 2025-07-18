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

- [x] Templates API
  - GET `/api/templates` – List templates
  - POST `/api/templates` – Create new template
  - Templates include:
    - Template name
    - System prompt
    - Config (e.g., chunk size, model)
- [x] Frontend UI
  - Template management page
  - Select a template before starting a chat
- [x] Templates stored in memory (or JSON file for now)

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

- [x] Stream chat responses (token-by-token)
- [x] Support large files (>100MB) with background processing
- [x] Dockerize app for deployment
- [x] Replace ChromaDB with Pinecone (optional)
- [x] Move file storage to AWS S3 (optional)

**Outcome:**  
Production-ready app with improved UX and scalability.

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
