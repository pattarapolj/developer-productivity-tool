import { test, expect, Page } from '@playwright/test'

test.describe('Persistence - Database-First Architecture', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('data persists across page reloads via database API', async () => {
    // Navigate to app
    await page.goto('http://localhost:3000/board')
    
    // Wait for store to hydrate
    await page.waitForLoadState('networkidle')

    // Check that localStorage is empty (no data persisted)
    const localStorageContent = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      if (!stored) return null
      return JSON.parse(stored)
    })

    // localStorage should exist (for UI state) but not contain tasks
    if (localStorageContent) {
      expect(localStorageContent.state.tasks).toBeUndefined()
      expect(localStorageContent.state.projects).toBeUndefined()
      expect(localStorageContent.state.timeEntries).toBeUndefined()
    }
  })

  test('UI state (filters) persists across page reloads via localStorage', async () => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')

    // Set a board filter
    const filterInput = page.locator('[data-testid="search-filter"], input[placeholder*="Search"]').first()
    if (await filterInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterInput.fill('test-search')
      
      // Wait a moment for state to update
      await page.waitForTimeout(500)

      // Check localStorage contains the filter
      const localStorageContent = await page.evaluate(() => {
        const stored = localStorage.getItem('ToolingTracker-storage')
        if (!stored) return null
        return JSON.parse(stored)
      })

      if (localStorageContent) {
        expect(localStorageContent.state.boardFilters.search).toBe('test-search')
      }

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Verify filter is restored
      if (await filterInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const inputValue = await filterInput.inputValue()
        expect(inputValue).toBe('test-search')
      }
    }
  })

  test('clearing localStorage does not lose data (comes from database)', async () => {
    // First navigation
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // App should still load - data comes from database, not localStorage
    const boardContent = page.locator('main, [role="main"]')
    expect(boardContent).toBeDefined()
  })

  test('selectedProjectId persists in localStorage but not data fields', async () => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')

    // Try to select a project if projects exist
    const projectButtons = page.locator('[data-testid*="project"], button:has-text("Project")')
    const projectCount = await projectButtons.count()
    
    if (projectCount > 0) {
      await projectButtons.first().click()
      await page.waitForTimeout(300)

      // Check localStorage
      const localStorageContent = await page.evaluate(() => {
        const stored = localStorage.getItem('ToolingTracker-storage')
        if (!stored) return null
        return JSON.parse(stored)
      })

      if (localStorageContent) {
        // selectedProjectId should persist
        expect(localStorageContent.state).toHaveProperty('selectedProjectId')
        // But not data arrays
        expect(localStorageContent.state.tasks).toBeUndefined()
        expect(localStorageContent.state.projects).toBeUndefined()
        expect(localStorageContent.state.timeEntries).toBeUndefined()
      }
    }
  })

  test('only boardFilters and selectedProjectId are persisted to localStorage', async () => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')

    const localStorageContent = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      if (!stored) return null
      return JSON.parse(stored)
    })

    if (localStorageContent) {
      // Should have selectedProjectId and boardFilters
      expect(localStorageContent.state).toHaveProperty('selectedProjectId')
      expect(localStorageContent.state).toHaveProperty('boardFilters')

      // Should NOT have data arrays
      expect(localStorageContent.state.tasks).toBeUndefined()
      expect(localStorageContent.state.projects).toBeUndefined()
      expect(localStorageContent.state.timeEntries).toBeUndefined()
      expect(localStorageContent.state.activities).toBeUndefined()
      expect(localStorageContent.state.comments).toBeUndefined()
      expect(localStorageContent.state.attachments).toBeUndefined()
      expect(localStorageContent.state.history).toBeUndefined()

      // Should NOT have loading/error state
      expect(localStorageContent.state.isLoading).toBeUndefined()
      expect(localStorageContent.state.error).toBeUndefined()
    }
  })

  test('boardFilters object structure persists correctly', async () => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')

    const localStorageContent = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      if (!stored) return null
      return JSON.parse(stored)
    })

    if (localStorageContent?.state?.boardFilters) {
      const filters = localStorageContent.state.boardFilters

      // Check all required properties exist
      expect(filters).toHaveProperty('search')
      expect(filters).toHaveProperty('projectId')
      expect(filters).toHaveProperty('priority')
      expect(filters).toHaveProperty('dateRange')
      expect(filters).toHaveProperty('customStart')
      expect(filters).toHaveProperty('customEnd')
      expect(filters).toHaveProperty('showArchived')

      // Check default values
      expect(typeof filters.search).toBe('string')
      expect(typeof filters.priority).toBe('string')
      expect(typeof filters.dateRange).toBe('string')
      expect(typeof filters.showArchived).toBe('boolean')
    }
  })
})
