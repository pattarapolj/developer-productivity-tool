import { test, expect } from '@playwright/test'

test.describe('Test Without Seeding', () => {
  test('create project and task without localStorage seeding', async ({ page }) => {
    // Start completely fresh - no seeding
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    console.log('\n=== Creating project via UI ===')
    
    // Navigate to projects page
    await page.goto('http://localhost:3000/projects')
    await page.waitForLoadState('networkidle')
    
    // Click "Add Project" button
    await page.getByRole('button', { name: /add project/i }).click()
    await page.waitForTimeout(500)
    
    // Fill project form
    await page.getByPlaceholder(/project name/i).fill('UI Created Project')
    await page.getByPlaceholder(/description/i).fill('Created through UI')
    
    // Select a color
    await page.locator('button[aria-label*="blue"], button:has-text("Blue")').first().click()
    
    // Click create
    await page.getByRole('button', { name: /^create$/i }).click()
    await page.waitForTimeout(1000)
    
    console.log('Project created, navigating back to board...')
    
    // Go back to board
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Verify project appears in sidebar
    const projectInSidebar = await page.locator('text="UI Created Project"').count()
    console.log(`Project in sidebar: ${projectInSidebar}`)
    
    // Now create a task
    console.log('\n=== Creating task via UI ===')
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    
    // Fill task
    await page.getByPlaceholder('Task title').fill('UI Created Task')
    
    // Submit
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(1000)
    
    // Check if task appears
    const taskInDOM = await page.locator('h4:has-text("UI Created Task")').count()
    console.log(`\nTask in DOM: ${taskInDOM}`)
    
    // Check localStorage
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log(`Tasks in localStorage: ${state?.state?.tasks?.length || 0}`)
    console.log(`Projects in localStorage: ${state?.state?.projects?.length || 0}`)
    
    // Verify task is visible
    await expect(page.locator('h4:has-text("UI Created Task")')).toBeVisible()
  })
})
