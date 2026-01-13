import { test, expect } from '@playwright/test'
import { clearStorage } from './helpers'

test.describe('Debug Selector', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
    await page.goto('/')
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('debug column and button selectors', async ({ page }) => {
    // Count all columns
    const allColumns = page.locator('div.flex.flex-col')
    const allColumnsCount = await allColumns.count()
    console.log(`Total div.flex.flex-col elements: ${allColumnsCount}`)

    // Find Backlog column by heading
    const backlogHeading = page.locator('h3:text-is("Backlog")')
    const backlogHeadingCount = await backlogHeading.count()
    console.log(`Backlog h3 count: ${backlogHeadingCount}`)

    // Try different column selectors
    const columnVariant1 = page.locator('div.flex.flex-col:has(h3:text-is("Backlog"))')
    const variant1Count = await columnVariant1.count()
    console.log(`div.flex.flex-col:has(h3:text-is("Backlog")) count: ${variant1Count}`)

    // Get all h-6 w-6 buttons in page
    const allSmallButtons = page.locator('button.h-6.w-6')
    const allSmallButtonsCount = await allSmallButtons.count()
    console.log(`Total button.h-6.w-6 in page: ${allSmallButtonsCount}`)

    // Get h-6 w-6 buttons in Backlog column
    const backlogButtons = columnVariant1.locator('button.h-6.w-6')
    const backlogButtonsCount = await backlogButtons.count()
    console.log(`button.h-6.w-6 in Backlog column: ${backlogButtonsCount}`)

    // Try to get button with Plus icon and ghost variant
    const ghostButtons = columnVariant1.locator('button[data-slot="button"]:has(svg.lucide-plus)')
    const ghostButtonsCount = await ghostButtons.count()
    console.log(`Plus icon buttons in Backlog column: ${ghostButtonsCount}`)

    // Print text of each found button
    for (let i = 0; i < Math.min(backlogButtonsCount, 5); i++) {
      const btn = backlogButtons.nth(i)
      const text = await btn.textContent()
      const classList = await btn.getAttribute('class')
      console.log(`Button ${i}: text="${text}", classes="${classList?.substring(0, 100)}"`)
    }
  })
})
