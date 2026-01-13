import { test, expect } from '@playwright/test'
import { seedTestProject } from './seed-project'

test.describe('Debug Zustand State', () => {
  test('investigate state after seeding and task creation', async ({ page }) => {
    // Clear and seed
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await seedTestProject(page)
    
    // Log state after seeding
    const stateAfterSeed = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log('\n=== State after seeding ===')
    console.log(JSON.stringify(stateAfterSeed, null, 2))
    
    // Verify project is visible in UI
    const projectCount = await page.locator('[data-testid="project"]').count()
    console.log(`\nProjects visible in UI: ${projectCount}`)
    
    // Open dialog
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    
    // Wait for dialog
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    
    // Check what's in the project selector
    const projectSelectorText = await page.locator('button:has-text("Select project")').textContent()
    console.log(`\nProject selector text: "${projectSelectorText}"`)
    
    // Fill form
    await page.getByPlaceholder('Task title').fill('Debug Task')
    
    // Log state before submit
    const stateBeforeSubmit = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log('\n=== State before submit ===')
    console.log(`Tasks: ${stateBeforeSubmit?.state?.tasks?.length || 0}`)
    console.log(`Projects: ${stateBeforeSubmit?.state?.projects?.length || 0}`)
    
    // Submit
    const createButton = page.getByRole('button', { name: /create task/i })
    await createButton.click()
    
    // Wait a bit for state to update
    await page.waitForTimeout(2000)
    
    // Log state after submit
    const stateAfterSubmit = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log('\n=== State after submit ===')
    console.log(JSON.stringify(stateAfterSubmit, null, 2))
    
    // Check if task is in localStorage
    const tasksInStorage = stateAfterSubmit?.state?.tasks || []
    console.log(`\nTasks in localStorage after submit: ${tasksInStorage.length}`)
    if (tasksInStorage.length > 0) {
      console.log('Task details:', JSON.stringify(tasksInStorage[0], null, 2))
    }
    
    // Check if task is in DOM
    const taskCards = await page.locator('h4:has-text("Debug Task")').count()
    console.log(`Task cards in DOM: ${taskCards}`)
    
    // Check what's actually in the Backlog column
    const backlogHTML = await backlogColumn.innerHTML()
    console.log('\n=== Backlog column HTML (first 500 chars) ===')
    console.log(backlogHTML.substring(0, 500))
    
    // Check count badge
    const countBadge = await backlogColumn.locator('span.text-xs.text-muted-foreground').first().textContent()
    console.log(`\nBacklog count badge: "${countBadge}"`)
  })
})
