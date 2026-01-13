import { test, expect } from '@playwright/test'
import { clearStorage } from './helpers'

test.describe('Debug Selector v2', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
    await page.goto('/')
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('find correct column selector', async ({ page }) => {
    // Try more specific selectors
    console.log('\n=== Testing Column Selectors ===')
    
    // Option 1: Column with bg-secondary class
    const option1 = page.locator('div.bg-secondary\\/30:has(h3:text-is("Backlog"))')
    console.log(`Option 1 (div.bg-secondary/30:has(h3)): ${await option1.count()}`)
    
    // Option 2: Column with rounded-lg
    const option2 = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    console.log(`Option 2 (div.rounded-lg:has(h3)): ${await option2.count()}`)
    
    // Option 3: Use data-column attribute or key
    const option3 = page.locator('[class*="flex-col"][class*="rounded-lg"]:has(h3:text-is("Backlog"))')
    console.log(`Option 3 (combined classes): ${await option3.count()}`)
    
    // Check if column has any unique data attributes
    const backlogHeading = page.locator('h3:text-is("Backlog")').first()
    const parentDiv = backlogHeading.locator('..')
    const grandparentDiv = parentDiv.locator('..')
    
    const parentClass = await parentDiv.getAttribute('class')
    const grandparentClass = await grandparentDiv.getAttribute('class')
    console.log(`\nParent of h3 classes: ${parentClass}`)
    console.log(`Grandparent of h3 classes: ${grandparentClass?.substring(0, 150)}`)
    
    // Test getting button from grandparent
    const buttonsInGrandparent = grandparentDiv.locator('button.h-6.w-6')
    console.log(`Buttons in grandparent: ${await buttonsInGrandparent.count()}`)
    
    // Try: Get the h3, go up to the column div, then find button
    const columnViaHeading = page.locator('h3:text-is("Backlog")').locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first()
    const buttonsViaXPath = columnViaHeading.locator('button.h-6.w-6')
    console.log(`Buttons via XPath ancestor: ${await buttonsViaXPath.count()}`)
  })
})
