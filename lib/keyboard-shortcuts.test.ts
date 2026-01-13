import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  eventToShortcutString,
  matchesShortcut,
  formatShortcut,
  ShortcutManager,
  getGlobalShortcutManager,
  detectConflicts,
  type KeyboardShortcut,
} from './keyboard-shortcuts'

describe('Keyboard Shortcuts', () => {
  describe('eventToShortcutString', () => {
    it('converts simple key event', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(eventToShortcutString(event)).toBe('A')
    })

    it('converts ctrl+key event', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })
      expect(eventToShortcutString(event)).toBe('Ctrl+A')
    })

    it('converts shift+key event', () => {
      const event = new KeyboardEvent('keydown', { key: 'A', shiftKey: true })
      expect(eventToShortcutString(event)).toBe('Shift+A')
    })

    it('converts multiple modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
      })
      expect(eventToShortcutString(event)).toBe('Ctrl+Shift+S')
    })

    it('converts space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' })
      expect(eventToShortcutString(event)).toBe('Space')
    })

    it('includes meta key', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
      expect(eventToShortcutString(event)).toBe('Meta+K')
    })
  })

  describe('matchesShortcut', () => {
    it('matches simple shortcut', () => {
      const shortcut: KeyboardShortcut = {
        key: 'a',
        description: 'Test',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', { key: 'a' })
      expect(matchesShortcut(event, shortcut)).toBe(true)
    })

    it('matches shortcut with modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: { ctrl: true },
        description: 'Save',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
      expect(matchesShortcut(event, shortcut)).toBe(true)
    })

    it('does not match without correct modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: { ctrl: true },
        description: 'Save',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', { key: 's' })
      expect(matchesShortcut(event, shortcut)).toBe(false)
    })

    it('does not match different key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'a',
        description: 'Test',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', { key: 'b' })
      expect(matchesShortcut(event, shortcut)).toBe(false)
    })

    it('matches space key', () => {
      const shortcut: KeyboardShortcut = {
        key: 'Space',
        description: 'Test',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', { key: ' ' })
      expect(matchesShortcut(event, shortcut)).toBe(true)
    })

    it('matches multiple modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 'k',
        modifiers: { ctrl: true, shift: true },
        description: 'Test',
        action: () => {},
      }
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
      })
      expect(matchesShortcut(event, shortcut)).toBe(true)
    })
  })

  describe('formatShortcut', () => {
    it('formats simple shortcut', () => {
      const shortcut: KeyboardShortcut = {
        key: 'a',
        description: 'Test',
        action: () => {},
      }
      const formatted = formatShortcut(shortcut)
      expect(formatted).toMatch(/a/i)
    })

    it('formats shortcut with ctrl', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: { ctrl: true },
        description: 'Save',
        action: () => {},
      }
      const formatted = formatShortcut(shortcut)
      expect(formatted).toContain('Ctrl')
      expect(formatted).toContain('s')
    })

    it('formats special keys', () => {
      const shortcuts = [
        { key: 'Space', expected: '␣' },
        { key: 'Enter', expected: '↵' },
        { key: 'Escape', expected: 'Esc' },
      ]

      shortcuts.forEach(({ key, expected }) => {
        const shortcut: KeyboardShortcut = {
          key,
          description: 'Test',
          action: () => {},
        }
        expect(formatShortcut(shortcut)).toContain(expected)
      })
    })

    it('formats arrow keys', () => {
      const shortcut: KeyboardShortcut = {
        key: 'ArrowUp',
        description: 'Test',
        action: () => {},
      }
      expect(formatShortcut(shortcut)).toContain('↑')
    })
  })

  describe('ShortcutManager', () => {
    let manager: ShortcutManager

    beforeEach(() => {
      manager = new ShortcutManager()
    })

    afterEach(() => {
      manager.stopListening()
      manager.clear()
    })

    it('registers shortcuts', () => {
      const action = vi.fn()
      manager.register('test', {
        key: 'a',
        description: 'Test',
        action,
      })

      const shortcut = manager.getShortcut('test')
      expect(shortcut).toBeDefined()
      expect(shortcut?.key).toBe('a')
    })

    it('unregisters shortcuts', () => {
      manager.register('test', {
        key: 'a',
        description: 'Test',
        action: () => {},
      })
      manager.unregister('test')

      expect(manager.getShortcut('test')).toBeUndefined()
    })

    it('enables and disables shortcuts', () => {
      manager.register('test', {
        key: 'a',
        description: 'Test',
        action: () => {},
      })

      manager.disable('test')
      expect(manager.getShortcut('test')?.enabled).toBe(false)

      manager.enable('test')
      expect(manager.getShortcut('test')?.enabled).toBe(true)
    })

    it('handles key events', () => {
      const action = vi.fn()
      manager.register('test', {
        key: 'a',
        modifiers: { ctrl: true },
        description: 'Test',
        action,
      })

      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })
      const handled = manager.handleKeyDown(event)

      expect(handled).toBe(true)
      expect(action).toHaveBeenCalled()
    })

    it('ignores disabled shortcuts', () => {
      const action = vi.fn()
      manager.register('test', {
        key: 'a',
        description: 'Test',
        action,
        enabled: false,
      })

      const event = new KeyboardEvent('keydown', { key: 'a' })
      const handled = manager.handleKeyDown(event)

      expect(handled).toBe(false)
      expect(action).not.toHaveBeenCalled()
    })

    it('ignores events in input fields', () => {
      const action = vi.fn()
      manager.register('test', {
        key: 'a',
        description: 'Test',
        action,
      })

      const input = document.createElement('input')
      const event = new KeyboardEvent('keydown', { key: 'a' })
      Object.defineProperty(event, 'target', { value: input, enumerable: true })

      const handled = manager.handleKeyDown(event)

      expect(handled).toBe(false)
      expect(action).not.toHaveBeenCalled()
    })

    it('returns all shortcuts', () => {
      manager.register('test1', {
        key: 'a',
        description: 'Test 1',
        action: () => {},
      })
      manager.register('test2', {
        key: 'b',
        description: 'Test 2',
        action: () => {},
      })

      const all = manager.getAllShortcuts()
      expect(Object.keys(all)).toHaveLength(2)
      expect(all.test1).toBeDefined()
      expect(all.test2).toBeDefined()
    })

    it('clears all shortcuts', () => {
      manager.register('test1', {
        key: 'a',
        description: 'Test 1',
        action: () => {},
      })
      manager.register('test2', {
        key: 'b',
        description: 'Test 2',
        action: () => {},
      })

      manager.clear()

      expect(Object.keys(manager.getAllShortcuts())).toHaveLength(0)
    })
  })

  describe('getGlobalShortcutManager', () => {
    it('returns singleton instance', () => {
      const manager1 = getGlobalShortcutManager()
      const manager2 = getGlobalShortcutManager()
      expect(manager1).toBe(manager2)
    })
  })

  describe('detectConflicts', () => {
    it('detects no conflicts', () => {
      const shortcuts = {
        test1: {
          key: 'a',
          description: 'Test 1',
          action: () => {},
        },
        test2: {
          key: 'b',
          description: 'Test 2',
          action: () => {},
        },
      }

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(0)
    })

    it('detects conflicts', () => {
      const shortcuts = {
        test1: {
          key: 'a',
          modifiers: { ctrl: true },
          description: 'Test 1',
          action: () => {},
        },
        test2: {
          key: 'a',
          modifiers: { ctrl: true },
          description: 'Test 2',
          action: () => {},
        },
      }

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].ids).toEqual(['test1', 'test2'])
    })

    it('groups multiple conflicts', () => {
      const shortcuts = {
        test1: {
          key: 'a',
          description: 'Test 1',
          action: () => {},
        },
        test2: {
          key: 'a',
          description: 'Test 2',
          action: () => {},
        },
        test3: {
          key: 'b',
          description: 'Test 3',
          action: () => {},
        },
        test4: {
          key: 'b',
          description: 'Test 4',
          action: () => {},
        },
      }

      const conflicts = detectConflicts(shortcuts)
      expect(conflicts).toHaveLength(2)
    })
  })
})
