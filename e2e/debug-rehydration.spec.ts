import { test, expect } from '@playwright/test'
import { seedTestProject } from './seed-project'

test.describe('Debug Zustand Rehydration', () => {
  test('check if zustand rehydrates after page load', async ({ page }) => {
    // Listen to console messages
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`)
    })
    
    // Clear and seed
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await seedTestProject(page)
    
    // Wait longer to ensure hydration
    await page.waitForTimeout(3000)
    
    // Check Zustand store directly in browser context
    const storeState = await page.evaluate(() => {
      // Access the Zustand store - need to find it in window or via React DevTools
      // For now, let's check localStorage
      const stored = localStorage.getItem('ToolingTracker-storage')
      return {
        localStorage: stored ? JSON.parse(stored) : null,
        // Try to get the actual store state - this might not work without direct access
        // We'll need to add a debug function to the store
      }
    })
    
    console.log('\n=== localStorage content ===')
    console.log(JSON.stringify(storeState.localStorage, null, 2))
    
    // Check if the kanban board component rendered with projects
    const boardHTML = await page.locator('[data-testid="kanban-board"], .kanban-board, main').first().innerHTML()
    console.log('\n=== Board HTML (first 1000 chars) ===')
    console.log(boardHTML.substring(0, 1000))
    
    // Try to find any text that suggests projects loaded
    const hasProjectText = await page.locator('text="Test Project"').count()
    console.log(`\nFound "Test Project" text: ${hasProjectText} times`)
    
    // Check sidebar for projects
    const sidebarProjects = await page.locator('[data-testid="sidebar-project"], .sidebar-project, nav a').count()
    console.log(`Sidebar project links: ${sidebarProjects}`)
  })
})
