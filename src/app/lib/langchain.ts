import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { vectorDB } from "./vectordb";
import { SYSTEM_MESSAGE } from "./systemMessage";

// Initialize OpenAI model
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
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

  async chatWithRAG(userMessage: string): Promise<string> {
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
      const relevantDocs = await vectorDB.search(userMessage, 5);

      // 2. Combine context with conversation history
      let context =
        relevantDocs.length > 0
          ? relevantDocs.join("\n\n")
          : "No relevant document context found.";

      // For system questions, provide app information even without documents
      if (isSystemQuestion && relevantDocs.length === 0) {
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
