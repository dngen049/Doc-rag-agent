import { ChatOllama } from "@langchain/ollama";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { vectorDB } from "./vectordb";
import { SYSTEM_MESSAGE } from "./systemMessage";

// Initialize Ollama model
const model = new ChatOllama({
  model: "llama3.2",
  temperature: 0.7,
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

// Conversation memory
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "history",
});

// RAG prompt template
const createRAGPrompt = (context: string, history: string, input: string) => `
${SYSTEM_MESSAGE}

Context from documents:
${context}

Current conversation:
${history}

Human: ${input}
Assistant: `;

class LangChainService {
  private conversationChain: ConversationChain;

  constructor() {
    this.conversationChain = new ConversationChain({
      llm: model,
      memory: memory,
    });
  }

  async chatWithRAG(
    userMessage: string,
    selectedDocuments?: string[],
    multiSelectMode?: boolean
  ): Promise<string> {
    try {
      // Check if this is a system-level question about the app
      const systemQuestions = [
        "what can you do",
        "how does this work",
        "what is this app",
        "help",
        "capabilities",
        "features",
        "how to use",
        "what documents",
        "uploaded documents",
      ];

      const isSystemQuestion = systemQuestions.some((question) =>
        userMessage.toLowerCase().includes(question)
      );

      // 1. Retrieve relevant context from vector database
      let relevantDocs: (string | null)[] = [];

      if (
        multiSelectMode &&
        selectedDocuments &&
        selectedDocuments.length > 0
      ) {
        // Search within selected documents only
        relevantDocs = await vectorDB.searchInContent(
          userMessage,
          selectedDocuments,
          5
        );
      } else if (!multiSelectMode) {
        // Search across all documents (fallback behavior)
        relevantDocs = await vectorDB.search(userMessage, 5);
      }

      // Filter out null values and ensure we have strings
      const filteredDocs = relevantDocs.filter(
        (doc): doc is string => doc !== null
      );

      // 2. Combine context with conversation history
      let context =
        filteredDocs.length > 0
          ? filteredDocs.join("\n\n")
          : "No relevant document context found.";

      // For system questions, provide app information even without documents
      if (isSystemQuestion && filteredDocs.length === 0) {
        context =
          "This is a Document Q&A application. Users can upload documents and ask questions about them.";
      }

      // 3. Create RAG prompt with context
      const history = await memory.loadMemoryVariables({});
      const prompt = createRAGPrompt(
        context,
        history.history || "",
        userMessage
      );

      // 4. Generate response
      const response = await model.invoke(prompt);

      // 5. Update conversation memory
      await memory.saveContext(
        { input: userMessage },
        { output: response.content as string }
      );

      return response.content as string;
    } catch (error) {
      console.error("LangChain RAG error:", error);
      throw new Error("Failed to generate response");
    }
  }

  async clearMemory(): Promise<void> {
    await memory.clear();
  }

  async getConversationHistory(): Promise<{ history: string }> {
    return (await memory.loadMemoryVariables({})) as { history: string };
  }
}

// Export singleton instance
export const langChainService = new LangChainService();
