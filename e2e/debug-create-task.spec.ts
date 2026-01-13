import { test, expect } from '@playwright/test'
import { seedTestProject } from './seed-project'

test.describe('Debug Task Creation Flow', () => {
  test('create task and verify state changes', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`)
      }
    })
    
    // Seed
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await seedTestProject(page)
    await page.waitForTimeout(2000)
    
    // Open dialog
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    
    // Fill title
    await page.getByPlaceholder('Task title').fill('Debug Task')
    await page.waitForTimeout(200)
    
    // Verify project is selected
    const projectText = await page.locator('[role="dialog"] [data-slot="select-trigger"]').first().textContent()
    console.log(`\nProject selected: "${projectText}"`)
    
    // Log state before submit
    const beforeState = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log(`\nTasks before submit: ${beforeState?.state?.tasks?.length || 0}`)
    
    // Click Create Task button
    const createButton = page.getByRole('button', { name: /create task/i })
    console.log('\nClicking Create Task button...')
    await createButton.click()
    
    // Wait and check if dialog closed
    await page.waitForTimeout(1000)
    const dialogStillVisible = await dialog.isVisible()
    console.log(`Dialog still visible after click: ${dialogStillVisible}`)
    
    // Log state after submit
    const afterState = await page.evaluate(() => {
      const stored = localStorage.getItem('ToolingTracker-storage')
      return stored ? JSON.parse(stored) : null
    })
    console.log(`\nTasks after submit: ${afterState?.state?.tasks?.length || 0}`)
    
    if (afterState?.state?.tasks?.length > 0) {
      console.log('\nTask created:')
      console.log(JSON.stringify(afterState.state.tasks[0], null, 2))
    }
    
    // Check if task appears in DOM
    await page.waitForTimeout(1000)
    const taskInDOM = await page.locator('h4:has-text("Debug Task")').count()
    console.log(`\nTask cards in DOM: ${taskInDOM}`)
    
    // Check what's in the Backlog column
    const backlogTasks = await backlogColumn.locator('h4').all()
    console.log(`\nAll h4 elements in Backlog: ${backlogTasks.length}`)
    for (const task of backlogTasks) {
      const text = await task.textContent()
      console.log(`- "${text}"`)
    }
    
    // Check count badge
    const countBadge = await backlogColumn.locator('span.text-xs.text-muted-foreground').first().textContent()
    console.log(`\nCount badge: "${countBadge}"`)
  })
})
