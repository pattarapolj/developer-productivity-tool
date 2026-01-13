import { test, expect } from '@playwright/test'
import { createProjectViaUI } from './create-project-ui'

test('debug edit dialog', async ({ page }) => {
  // Setup
  await page.goto('http://localhost:3000/board')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await createProjectViaUI(page, 'Test Project')
  await page.waitForSelector('h3:text-is("Backlog")')

  // Create a task
  const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
  const addButton = backlogColumn.locator('button.h-6.w-6')
  await addButton.click()
  await page.waitForTimeout(300)
  await page.getByPlaceholder('Task title').fill('Edit Me')
  await page.getByRole('button', { name: /create task/i }).click()
  await page.waitForTimeout(1000)

  // Click on the task
  const taskCard = page.locator('h4:text-is("Edit Me")').locator('..')
  await taskCard.click()
  await page.waitForTimeout(1000)

  // Debug: Check what's visible
  const dialog = page.locator('[role="dialog"]')
  const dialogVisible = await dialog.isVisible()
  console.log('Dialog visible:', dialogVisible)

  if (dialogVisible) {
    const titleInput = page.getByPlaceholder('Task title')
    const titleVisible = await titleInput.isVisible()
    console.log('Title input visible:', titleVisible)

    // Check for tabs
    const detailsTab = page.getByRole('tab', { name: /details/i })
    const tabsVisible = await detailsTab.isVisible().catch(() => false)
    console.log('Tabs visible:', tabsVisible)

    // Check all buttons
    const allButtons = await page.locator('button').allTextContents()
    console.log('All button texts:', allButtons)

    // Try to find update button by text
    const updateByText = page.locator('button:has-text("Update Task")')
    const updateVisible = await updateByText.isVisible().catch(() => false)
    console.log('Update button visible (by text):', updateVisible)
  }
})
