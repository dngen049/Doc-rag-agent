import { SYSTEM_MESSAGE } from '../systemMessage'

describe('systemMessage', () => {
  describe('SYSTEM_MESSAGE', () => {
    it('should be a non-empty string', () => {
      expect(typeof SYSTEM_MESSAGE).toBe('string')
      expect(SYSTEM_MESSAGE.length).toBeGreaterThan(0)
    })

    it('should contain the main title', () => {
      expect(SYSTEM_MESSAGE).toContain('Document Q&A application')
    })

    it('should contain what the app does section', () => {
      expect(SYSTEM_MESSAGE).toContain('What This App Does')
      expect(SYSTEM_MESSAGE).toContain('upload documents')
      expect(SYSTEM_MESSAGE).toContain('answer questions')
      expect(SYSTEM_MESSAGE).toContain('conversation memory')
    })

    it('should contain how to use section', () => {
      expect(SYSTEM_MESSAGE).toContain('How to Use the App')
      expect(SYSTEM_MESSAGE).toContain('Upload Documents')
      expect(SYSTEM_MESSAGE).toContain('Ask Questions')
      expect(SYSTEM_MESSAGE).toContain('Get Answers')
      expect(SYSTEM_MESSAGE).toContain('Conversation Memory')
    })

    it('should contain capabilities section', () => {
      expect(SYSTEM_MESSAGE).toContain('Your Capabilities')
      expect(SYSTEM_MESSAGE).toContain('Document Search')
      expect(SYSTEM_MESSAGE).toContain('Contextual Answers')
      expect(SYSTEM_MESSAGE).toContain('Multiple Documents')
      expect(SYSTEM_MESSAGE).toContain('Follow-up Questions')
    })

    it('should contain best practices section', () => {
      expect(SYSTEM_MESSAGE).toContain('Best Practices')
      expect(SYSTEM_MESSAGE).toContain('base your answers on the document content')
      expect(SYSTEM_MESSAGE).toContain('stay focused on the document content')
    })

    it('should contain limitations section', () => {
      expect(SYSTEM_MESSAGE).toContain('Limitations')
      expect(SYSTEM_MESSAGE).toContain('uploaded documents')
      expect(SYSTEM_MESSAGE).toContain('TXT and MD files')
      expect(SYSTEM_MESSAGE).toContain('10MB')
    })

    it('should contain response style section', () => {
      expect(SYSTEM_MESSAGE).toContain('Response Style')
      expect(SYSTEM_MESSAGE).toContain('helpful and friendly')
      expect(SYSTEM_MESSAGE).toContain('clear, concise answers')
      expect(SYSTEM_MESSAGE).toContain('markdown formatting')
    })

    it('should contain primary role statement', () => {
      expect(SYSTEM_MESSAGE).toContain('primary role')
      expect(SYSTEM_MESSAGE).toContain('help users understand')
      expect(SYSTEM_MESSAGE).toContain('uploaded documents')
    })

    it('should be consistent across multiple accesses', () => {
      const firstAccess = SYSTEM_MESSAGE
      const secondAccess = SYSTEM_MESSAGE

      expect(firstAccess).toBe(secondAccess)
    })

    it('should contain markdown formatting indicators', () => {
      expect(SYSTEM_MESSAGE).toContain('##')
      expect(SYSTEM_MESSAGE).toContain('**')
      expect(SYSTEM_MESSAGE).toContain('-')
    })
  })
})

