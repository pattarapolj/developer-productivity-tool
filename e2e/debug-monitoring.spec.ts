import { test, expect } from '@playwright/test'
import { seedTestProject } from './seed-project'

test.describe('Debug Store Subscription', () => {
  test('check if store updates trigger component re-renders', async ({ page }) => {
    // Enable detailed logging
    await page.addInitScript(() => {
      // @ts-ignore
      window.renderCount = 0
      // Intercept console.log to see Zustand logs
      const originalLog = console.log
      console.log = function(...args) {
        // @ts-ignore
        originalLog.apply(console, ['[INIT]', ...args])
      }
    })
    
    // Seed
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await seedTestProject(page)
    await page.waitForTimeout(2000)
    
    // Add a script to monitor Zustand store changes
    const storeMonitoring = await page.evaluate(() => {
      // Try to access the store directly
      const storedData = localStorage.getItem('ToolingTracker-storage')
      return {
        localStorage: storedData ? JSON.parse(storedData) : null,
        // We can't easily access Zustand store from browser context
        // but we can check if React is rendering
      }
    })
    
    console.log('\n=== Before creating task ===')
    console.log(`localStorage tasks: ${storeMonitoring.localStorage?.state?.tasks?.length || 0}`)
    
    // Open dialog and create task
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(500)
    
    await page.getByPlaceholder('Task title').fill('Monitor Test')
    await page.getByRole('button', { name: /create task/i }).click()
    
    // Wait and repeatedly check if task appears
    console.log('\n=== Waiting for task to appear ===')
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500)
      const taskCount = await page.locator('h4:has-text("Monitor Test")').count()
      const storageState = await page.evaluate(() => {
        const stored = localStorage.getItem('ToolingTracker-storage')
        return stored ? JSON.parse(stored) : null
      })
      console.log(`Attempt ${i + 1}: DOM tasks=${taskCount}, localStorage tasks=${storageState?.state?.tasks?.length || 0}`)
      
      if (taskCount > 0) {
        console.log('✅ Task appeared in DOM!')
        break
      }
    }
    
    // Final check
    const finalTaskCount = await page.locator('h4:has-text("Monitor Test")').count()
    console.log(`\n=== Final Result ===`)
    console.log(`Tasks in DOM: ${finalTaskCount}`)
    
    if (finalTaskCount === 0) {
      // Try to force a re-render by clicking somewhere
      console.log('\n=== Attempting to trigger re-render ===')
      await page.locator('body').click()
      await page.waitForTimeout(1000)
      const afterClickCount = await page.locator('h4:has-text("Monitor Test")').count()
      console.log(`After click: ${afterClickCount}`)
    }
  })
})
