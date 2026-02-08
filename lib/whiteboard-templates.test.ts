import { describe, it, expect } from 'vitest'
import { getAllTemplates, getTemplateById, getBlankTemplate } from './whiteboard-templates'
import type { WhiteboardTemplate } from './whiteboard-templates'

describe('Whiteboard Templates', () => {
  describe('getAllTemplates', () => {
    it('should return exactly 5 templates', () => {
      const templates = getAllTemplates()
      expect(templates).toHaveLength(5)
    })

    it('should return templates with all required fields', () => {
      const templates = getAllTemplates()
      templates.forEach((template) => {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('name')
        expect(template).toHaveProperty('description')
        expect(template).toHaveProperty('thumbnail')
        expect(template).toHaveProperty('elements')
      })
    })

    it('should have valid template IDs', () => {
      const templates = getAllTemplates()
      const ids = templates.map((t) => t.id)
      expect(ids).toContain('blank-canvas')
      expect(ids).toContain('meeting-agenda')
      expect(ids).toContain('sprint-retrospective')
      expect(ids).toContain('brainstorm-canvas')
      expect(ids).toContain('architecture-diagram')
    })

    it('should have unique template IDs', () => {
      const templates = getAllTemplates()
      const ids = templates.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have non-empty names', () => {
      const templates = getAllTemplates()
      templates.forEach((template) => {
        expect(template.name).toBeTruthy()
        expect(typeof template.name).toBe('string')
      })
    })

    it('should have non-empty descriptions', () => {
      const templates = getAllTemplates()
      templates.forEach((template) => {
        expect(template.description).toBeTruthy()
        expect(typeof template.description).toBe('string')
      })
    })

    it('should have elements array', () => {
      const templates = getAllTemplates()
      templates.forEach((template) => {
        expect(Array.isArray(template.elements)).toBe(true)
      })
    })

    it('should have thumbnail string', () => {
      const templates = getAllTemplates()
      templates.forEach((template) => {
        expect(typeof template.thumbnail).toBe('string')
      })
    })
  })

  describe('getTemplateById', () => {
    it('should return correct template for blank-canvas ID', () => {
      const template = getTemplateById('blank-canvas')
      expect(template).toBeDefined()
      expect(template?.id).toBe('blank-canvas')
      expect(template?.name).toBe('Blank Canvas')
    })

    it('should return correct template for meeting-agenda ID', () => {
      const template = getTemplateById('meeting-agenda')
      expect(template).toBeDefined()
      expect(template?.id).toBe('meeting-agenda')
      expect(template?.name).toBe('Meeting Agenda')
    })

    it('should return correct template for sprint-retrospective ID', () => {
      const template = getTemplateById('sprint-retrospective')
      expect(template).toBeDefined()
      expect(template?.id).toBe('sprint-retrospective')
      expect(template?.name).toBe('Sprint Retrospective')
    })

    it('should return correct template for brainstorm-canvas ID', () => {
      const template = getTemplateById('brainstorm-canvas')
      expect(template).toBeDefined()
      expect(template?.id).toBe('brainstorm-canvas')
      expect(template?.name).toBe('Brainstorm Canvas')
    })

    it('should return correct template for architecture-diagram ID', () => {
      const template = getTemplateById('architecture-diagram')
      expect(template).toBeDefined()
      expect(template?.id).toBe('architecture-diagram')
      expect(template?.name).toBe('Architecture Diagram')
    })

    it('should return null for invalid ID', () => {
      const template = getTemplateById('invalid-id')
      expect(template).toBeNull()
    })

    it('should return null for empty ID', () => {
      const template = getTemplateById('')
      expect(template).toBeNull()
    })
  })

  describe('getBlankTemplate', () => {
    it('should return blank-canvas template', () => {
      const template = getBlankTemplate()
      expect(template.id).toBe('blank-canvas')
      expect(template.name).toBe('Blank Canvas')
    })

    it('should have empty elements array', () => {
      const template = getBlankTemplate()
      expect(template.elements).toEqual([])
    })

    it('should be the same as getTemplateById("blank-canvas")', () => {
      const blankTemplate = getBlankTemplate()
      const templateById = getTemplateById('blank-canvas')
      expect(blankTemplate).toEqual(templateById)
    })
  })

  describe('Template element validity', () => {
    it('blank canvas should have empty elements', () => {
      const template = getTemplateById('blank-canvas')
      expect(template?.elements).toHaveLength(0)
    })

    it('meeting agenda should have elements', () => {
      const template = getTemplateById('meeting-agenda')
      expect(template?.elements.length).toBeGreaterThan(0)
    })

    it('sprint retrospective should have elements', () => {
      const template = getTemplateById('sprint-retrospective')
      expect(template?.elements.length).toBeGreaterThan(0)
    })

    it('brainstorm canvas should have elements', () => {
      const template = getTemplateById('brainstorm-canvas')
      expect(template?.elements.length).toBeGreaterThan(0)
    })

    it('architecture diagram should have elements', () => {
      const template = getTemplateById('architecture-diagram')
      expect(template?.elements.length).toBeGreaterThan(0)
    })

    it('all non-blank templates should have at least 3 elements', () => {
      const templates = getAllTemplates().filter((t) => t.id !== 'blank-canvas')
      templates.forEach((template) => {
        expect(template.elements.length).toBeGreaterThanOrEqual(3)
      })
    })
  })
})
