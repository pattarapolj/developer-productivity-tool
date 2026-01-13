import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData } from './helpers'

test.describe('Basic E2E Smoke Test', () => {
  test('should load board page with seeded data', async ({ page }) => {
    await clearStorage(page)
    await seedSampleData(page)

    // Debug: Check if localStorage has data
    const storageData = await page.evaluate(() => {
      const data = localStorage.getItem('ToolingTracker-storage')
      console.log('LocalStorage data:', data)
      return data
    })
    console.log('Storage exists:', !!storageData)

    // Wait for board to load and tasks to hydrate
    // KanbanBoard has a `mounted` state that delays rendering
    await page.waitForSelector('h3:has-text("Backlog")', { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for Zustand hydration and React mount

    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/board-screenshot.png', fullPage: true })

    // Debug: Check the HTML content
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('Body HTML length:', bodyHTML.length)
    console.log('Body contains "Backlog":', bodyHTML.includes('Backlog'))
    console.log('Body contains "Refactor":', bodyHTML.includes('Refactor'))

    // Check if we can find any column headings
    const backlogHeading = page.locator('h3', { hasText: 'Backlog' })
    await expect(backlogHeading).toBeVisible({ timeout: 10000 })

    // Debug: Extract all text from the page columns
    const columns = page.locator('div.flex.flex-col.bg-secondary\\/30')
    const columnCount = await columns.count()
    console.log(`Found ${columnCount} columns`)
    
    for (let i = 0; i < columnCount; i++) {
      const columnText = await columns.nth(i).textContent()
      console.log(`Column ${i} text:`, columnText?.substring(0, 200))
    }

    // Check if we can find any task cards
    // TaskCard component wraps content in a Card with role="button"
    const taskCards = page.locator('[role="button"][tabindex="0"]')
    const count = await taskCards.count()
    console.log(`Found ${count} task cards with role=button and tabindex`)
    
    // Try alternate selector
    const cardsAlt = page.locator('.cursor-pointer')
    const countAlt = await cardsAlt.count()
    console.log(`Found ${countAlt} elements with cursor-pointer class`)
    
    // List all role=button elements
    const allButtons = page.locator('[role="button"]')
    const buttonCount = await allButtons.count()
    console.log(`Found ${buttonCount} total elements with role=button`)
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const text = await allButtons.nth(i).textContent()
      const ariaLabel = await allButtons.nth(i).getAttribute('aria-label')
      console.log(`Button ${i}: aria-label="${ariaLabel}", text="${text?.substring(0, 50)}"`)
    }
    
    expect(count).toBeGreaterThan(0)

    // Try to find specific task
    const loginTask = page.locator('h4:text-is("Refactor login component")')
    await expect(loginTask).toBeVisible()
  })
})
