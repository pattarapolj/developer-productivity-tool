import { type Page } from '@playwright/test'

/**
 * Seed a minimal project in localStorage for testing
 * Sets data BEFORE first navigation to avoid rehydration conflicts
 */
export async function seedTestProject(page: Page) {
  // Set localStorage BEFORE navigating to let Zustand hydrate normally
  await page.context().addInitScript(() => {
    const state = {
      projects: [
        {
          id: 'test-project-1',
          name: 'Test Project',
          color: 'blue',
          subcategories: [],
          jiraKey: null,
          createdAt: new Date().toISOString(),
        },
      ],
      tasks: [],
      timeEntries: [],
      activities: [],
      comments: [],
      attachments: [],
      history: [],
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: null,
        priority: null,
        dateRange: null,
        showArchived: false,
      },
    }

    localStorage.setItem('ToolingTracker-storage', JSON.stringify({ state, version: 1 }))
  })
  
  // Now navigate - Zustand will hydrate from localStorage on initial load
  await page.goto('http://localhost:3000/board')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
}
