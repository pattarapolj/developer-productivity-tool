export interface KeyboardShortcut {
  key: string
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
  description: string
  action: () => void
  category?: string
  enabled?: boolean
}

export interface ShortcutRegistry {
  [id: string]: KeyboardShortcut
}

/**
 * Parse keyboard event to shortcut string
 */
export function eventToShortcutString(event: KeyboardEvent): string {
  const parts: string[] = []
  
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Meta')
  
  // Normalize the key
  let key = event.key
  if (key === ' ') key = 'Space'
  if (key.length === 1) key = key.toUpperCase()
  
  parts.push(key)
  
  return parts.join('+')
}

/**
 * Check if shortcut matches event
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const modifiers = shortcut.modifiers || {}
  
  if (!!event.ctrlKey !== !!modifiers.ctrl) return false
  if (!!event.altKey !== !!modifiers.alt) return false
  if (!!event.shiftKey !== !!modifiers.shift) return false
  if (!!event.metaKey !== !!modifiers.meta) return false
  
  let key = event.key
  if (key === ' ') key = 'Space'
  if (key.length === 1) key = key.toUpperCase()
  
  let shortcutKey = shortcut.key
  if (shortcutKey.length === 1) shortcutKey = shortcutKey.toUpperCase()
  
  return key === shortcutKey
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  const modifiers = shortcut.modifiers || {}
  
  // Use platform-specific modifier names
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  if (modifiers.ctrl) parts.push(isMac ? '⌃' : 'Ctrl')
  if (modifiers.alt) parts.push(isMac ? '⌥' : 'Alt')
  if (modifiers.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (modifiers.meta) parts.push(isMac ? '⌘' : 'Win')
  
  let key = shortcut.key
  if (key === 'Space') key = '␣'
  if (key === 'Enter') key = '↵'
  if (key === 'Escape') key = 'Esc'
  if (key === 'ArrowUp') key = '↑'
  if (key === 'ArrowDown') key = '↓'
  if (key === 'ArrowLeft') key = '←'
  if (key === 'ArrowRight') key = '→'
  
  parts.push(key)
  
  return parts.join(isMac ? '' : '+')
}

/**
 * Shortcut manager class
 */
export class ShortcutManager {
  private shortcuts: ShortcutRegistry = {}
  private listener: ((event: KeyboardEvent) => void) | null = null

  register(id: string, shortcut: KeyboardShortcut): void {
    this.shortcuts[id] = { ...shortcut, enabled: shortcut.enabled !== false }
  }

  unregister(id: string): void {
    delete this.shortcuts[id]
  }

  enable(id: string): void {
    if (this.shortcuts[id]) {
      this.shortcuts[id].enabled = true
    }
  }

  disable(id: string): void {
    if (this.shortcuts[id]) {
      this.shortcuts[id].enabled = false
    }
  }

  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts[id]
  }

  getAllShortcuts(): ShortcutRegistry {
    return { ...this.shortcuts }
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    // Ignore shortcuts when typing in input fields
    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return false
    }

    for (const [id, shortcut] of Object.entries(this.shortcuts)) {
      if (shortcut.enabled !== false && matchesShortcut(event, shortcut)) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        return true
      }
    }

    return false
  }

  startListening(): void {
    if (this.listener) return

    this.listener = (event: KeyboardEvent) => {
      this.handleKeyDown(event)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.listener)
    }
  }

  stopListening(): void {
    if (this.listener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.listener)
      this.listener = null
    }
  }

  clear(): void {
    this.shortcuts = {}
  }
}

/**
 * Create global shortcut manager instance
 */
let globalManager: ShortcutManager | null = null

export function getGlobalShortcutManager(): ShortcutManager {
  if (!globalManager) {
    globalManager = new ShortcutManager()
  }
  return globalManager
}

/**
 * Detect shortcut conflicts
 */
export function detectConflicts(shortcuts: ShortcutRegistry): Array<{
  ids: string[]
  shortcut: string
}> {
  const conflicts: Array<{ ids: string[]; shortcut: string }> = []
  const shortcutMap = new Map<string, string[]>()

  for (const [id, shortcut] of Object.entries(shortcuts)) {
    const key = formatShortcut(shortcut)
    const existing = shortcutMap.get(key) || []
    existing.push(id)
    shortcutMap.set(key, existing)
  }

  for (const [shortcut, ids] of shortcutMap.entries()) {
    if (ids.length > 1) {
      conflicts.push({ ids, shortcut })
    }
  }

  return conflicts
}
