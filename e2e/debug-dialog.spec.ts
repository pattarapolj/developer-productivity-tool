import { test, expect } from '@playwright/test'
import { seedTestProject } from './seed-project'

test.describe('Debug Task Dialog Project Selection', () => {
  test('check project selector state in dialog', async ({ page }) => {
    // Seed and wait for full hydration
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await seedTestProject(page)
    
    // Wait extra time to ensure Zustand is fully hydrated
    await page.waitForTimeout(2000)
    
    // Verify project is in sidebar (confirming hydration worked)
    const projectInSidebar = await page.locator('text="Test Project"').count()
    console.log(`\nProject in sidebar: ${projectInSidebar}`)
    expect(projectInSidebar).toBeGreaterThan(0)
    
    // Open dialog
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    
    // Wait for dialog
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(500)
    
    // Check the project selector button
    const projectSelector = page.locator('[role="dialog"]').locator('button').filter({ hasText: /select project|test project/i })
    const projectSelectorCount = await projectSelector.count()
    console.log(`\nProject selector buttons: ${projectSelectorCount}`)
    
    if (projectSelectorCount > 0) {
      const projectSelectorText = await projectSelector.first().textContent()
      console.log(`Project selector text: "${projectSelectorText}"`)
    }
    
    // Check all buttons in the dialog
    const allDialogButtons = await page.locator('[role="dialog"] button').all()
    console.log(`\nAll buttons in dialog: ${allDialogButtons.length}`)
    for (let i = 0; i < Math.min(allDialogButtons.length, 10); i++) {
      const text = await allDialogButtons[i].textContent()
      const classes = await allDialogButtons[i].getAttribute('class')
      console.log(`Button ${i}: "${text?.trim()}" (has "Select": ${text?.includes('Select')})`)
    }
    
    // Try to get the SelectTrigger specifically
    const selectTrigger = page.locator('[role="dialog"] [data-slot="select-trigger"], [role="dialog"] .select-trigger').first()
    const selectTriggerExists = await selectTrigger.count()
    console.log(`\nSelectTrigger exists: ${selectTriggerExists}`)
    
    if (selectTriggerExists > 0) {
      const selectValue = await selectTrigger.textContent()
      console.log(`SelectTrigger value: "${selectValue}"`)
    }
  })
})
