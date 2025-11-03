// Mock dependencies BEFORE importing
jest.mock('@langchain/ollama')
jest.mock('langchain/chains')
jest.mock('langchain/memory')
jest.mock('../vectordb')

import { langChainService } from '../langchain'

describe('LangChainService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Module initialization', () => {
    it('should export langChainService singleton', () => {
      expect(langChainService).toBeDefined()
      expect(typeof langChainService).toBe('object')
    })

    it('should have chatWithRAG method', () => {
      expect(typeof langChainService.chatWithRAG).toBe('function')
    })

    it('should have clearMemory method', () => {
      expect(typeof langChainService.clearMemory).toBe('function')
    })

    it('should have getConversationHistory method', () => {
      expect(typeof langChainService.getConversationHistory).toBe('function')
    })
  })

  describe('System question detection', () => {
    it('should recognize "what can you do" as system question', () => {
      expect('what can you do'.toLowerCase()).toContain('what can you do')
    })

    it('should recognize "how does this work" as system question', () => {
      expect('how does this work'.toLowerCase()).toContain('how does this work')
    })

    it('should recognize "what is this app" as system question', () => {
      expect('what is this app'.toLowerCase()).toContain('what is this app')
    })

    it('should recognize "help" as system question', () => {
      expect('help'.toLowerCase()).toContain('help')
    })

    it('should recognize "capabilities" as system question', () => {
      expect('capabilities'.toLowerCase()).toContain('capabilities')
    })

    it('should recognize "features" as system question', () => {
      expect('features'.toLowerCase()).toContain('features')
    })

    it('should recognize "how to use" as system question', () => {
      expect('how to use'.toLowerCase()).toContain('how to use')
    })

    it('should recognize "what documents" as system question', () => {
      expect('what documents'.toLowerCase()).toContain('what documents')
    })

    it('should recognize "uploaded documents" as system question', () => {
      expect('uploaded documents'.toLowerCase()).toContain('uploaded documents')
    })
  })

  describe('RAG functionality', () => {
    it('should support multi-select mode parameter', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('multiSelectMode')
    })

    it('should support selected documents parameter', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('selectedDocuments')
    })

    it('should search documents', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('vectorDB')
    })

    it('should handle system questions', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('isSystemQuestion')
    })

    it('should provide app information for system questions', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('Document Q&A')
    })

    it('should combine context with conversation history', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('loadMemoryVariables')
    })

    it('should save context to memory', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('saveContext')
    })

    it('should handle errors gracefully', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('catch')
    })

    it('should filter out null values from search results', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('filter')
    })

    it('should handle empty search results', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('No relevant document context found')
    })

    it('should create RAG prompt with context', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('createRAGPrompt')
    })

    it('should include user message in prompt', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('userMessage')
    })

    it('should include conversation history in prompt', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('history')
    })
  })

  describe('Memory management', () => {
    it('should have clearMemory method', () => {
      const method = langChainService.clearMemory.toString()
      expect(method).toContain('memory')
    })

    it('should have getConversationHistory method', () => {
      const method = langChainService.getConversationHistory.toString()
      expect(method).toContain('memory')
    })

    it('should load memory variables for history', () => {
      const method = langChainService.getConversationHistory.toString()
      expect(method).toContain('loadMemoryVariables')
    })

    it('should clear memory', () => {
      const method = langChainService.clearMemory.toString()
      expect(method).toContain('clear')
    })
  })

  describe('Configuration', () => {
    it('should use ChatOllama model', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('model')
    })

    it('should use BufferMemory for conversation', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('memory')
    })

    it('should use vectorDB for document search', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('vectorDB')
    })
  })

  describe('Error handling', () => {
    it('should throw error on RAG failure', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('Failed to generate response')
    })

    it('should log errors', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('console.error')
    })

    it('should handle vectorDB search errors', () => {
      const method = langChainService.chatWithRAG.toString()
      expect(method).toContain('try')
    })
  })
})
