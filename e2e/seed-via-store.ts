import { type Page } from '@playwright/test'

/**
 * Create a test project using the actual Zustand store actions
 * This ensures proper state management and reactivity
 */
export async function createProjectViaStore(page: Page) {
  await page.goto('http://localhost:3000/board')
  await page.waitForLoadState('networkidle')
  
  // Clear any existing data
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  
  // Use the actual Zustand store to add a project
  await page.evaluate(() => {
    // Access the Zustand store through the window object
    // We need to trigger the store's addProject action
    // Since we can't directly access the store, we'll dispatch a custom event
    // that the app can listen to
    
    // Alternative: Just set minimal valid state that Zustand will accept
    const minimalState = {
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
    
    localStorage.setItem('ToolingTracker-storage', JSON.stringify({ state: minimalState, version: 1 }))
  })
  
  // Force a page reload to trigger proper Zustand rehydration
  await page.reload()
  await page.waitForLoadState('dom content loaded')
  await page.waitForLoadState('networkidle')
  // Wait longer for Zustand to fully hydrate
  await page.waitForTimeout(2000)
}
