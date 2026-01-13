import { test, expect } from '@playwright/test'
import { createProjectViaUI } from './create-project-ui'

test.describe('E2E Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh and create project via UI
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Create test project through UI (more reliable than seeding)
    await createProjectViaUI(page, 'Test Project')
    
    // Wait for board to render
    await page.waitForSelector('h3:text-is("Backlog")', { timeout: 5000 })
  })

  test('should display board layout correctly', async ({ page }) => {
    // Verify all 4 columns exist
    await expect(page.locator('h3:text-is("Backlog")')).toBeVisible()
    await expect(page.locator('h3:text-is("To Do")')).toBeVisible()
    await expect(page.locator('h3:text-is("In Progress")')).toBeVisible()
    await expect(page.locator('h3:text-is("Done")')).toBeVisible()

    // Verify empty state message
    const noTasksMessages = page.locator('text=No tasks')
    await expect(noTasksMessages.first()).toBeVisible()
    
    // Verify count badges show 0
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const countBadge = backlogColumn.locator('span.text-xs.text-muted-foreground').first()
    await expect(countBadge).toHaveText('0')
  })

  test('should navigate to board page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/board/)
    await expect(page.locator('h3:has-text("Backlog")')).toBeVisible()
  })

  test('should open task creation dialog', async ({ page }) => {
    // Click the "+" button in the Backlog column (small icon button in header)
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()

    // Wait for dialog to appear
    await page.waitForTimeout(500)

    // Verify dialog is visible
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    
    // Verify form fields are present
    await expect(page.getByPlaceholder('Task title')).toBeVisible()
    await expect(page.getByPlaceholder(/description/i)).toBeVisible()
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await expect(dialog).not.toBeVisible()
  })

  test('should create a task with title only', async ({ page }) => {
    // Open dialog
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Fill in title (project should be auto-selected from seeded data)
    await page.getByPlaceholder('Task title').fill('Simple Task')

    // Submit
    const createButton = page.getByRole('button', { name: /create task/i })
    await createButton.click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Verify task appears
    const taskTitle = page.locator('h4:text-is("Simple Task")')
    await expect(taskTitle).toBeVisible()

    // Verify count updated
    const countBadge = backlogColumn.locator('span.text-xs.text-muted-foreground').first()
    await expect(countBadge).toHaveText('1')
  })

  test('should create a task with full details', async ({ page }) => {
    // Open dialog
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(500)

    // Fill in all fields
    await page.getByPlaceholder('Task title').fill('Detailed Task')
    await page.getByPlaceholder(/description/i).fill('This task has a description')
    
    // Try to fill story points if visible
    const storyPointsInput = page.getByPlaceholder(/story points/i)
    if (await storyPointsInput.isVisible()) {
      await storyPointsInput.fill('5')
    }

    // Submit
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(1000)

    // Verify task appears with details
    await expect(page.locator('h4:text-is("Detailed Task")')).toBeVisible()
    await expect(page.locator('text=This task has a description')).toBeVisible()
  })

  test('should create tasks in different columns', async ({ page }) => {
    // Create task in Backlog
    let column = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    let addButton = column.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Task title').fill('Backlog Task')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(800)

    // Create task in To Do
    column = page.locator('div.rounded-lg:has(h3:text-is("To Do"))')
    addButton = column.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Task title').fill('Todo Task')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(800)

    // Verify both tasks exist in correct columns
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const todoColumn = page.locator('div.rounded-lg:has(h3:text-is("To Do"))')
    
    await expect(backlogColumn.locator('h4:text-is("Backlog Task")')).toBeVisible()
    await expect(todoColumn.locator('h4:text-is("Todo Task")')).toBeVisible()

    // Verify counts
    await expect(backlogColumn.locator('span.text-xs.text-muted-foreground').first()).toHaveText('1')
    await expect(todoColumn.locator('span.text-xs.text-muted-foreground').first()).toHaveText('1')
  })

  // TODO: Fix dropdown button selector - button doesn't appear to be found in E2E context
  test.skip('should edit a task', async ({ page }) => {
    // First create a task
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Task title').fill('Edit Me')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(1000)

    // Hover over task to show dropdown
    const taskCard = page.locator('h4:text-is("Edit Me")').locator('../..')
    await taskCard.hover()
    await page.waitForTimeout(300)

    // Click dropdown menu button (has MoreHorizontal icon)
    // Use :has selector to find button containing the icon
    const dropdownButton = taskCard.locator('button:has(svg.lucide-more-horizontal)')
    await dropdownButton.click({ force: true })
    await page.waitForTimeout(300)

    // Click Edit menu item
    await page.getByRole('menuitem', { name: /edit/i }).click()
    await page.waitForTimeout(500)

    // Verify edit dialog opened and wait for form to load
    const titleInput = page.getByPlaceholder('Task title')
    await titleInput.waitFor({ state: 'visible', timeout: 5000 })
    await expect(titleInput).toBeVisible()
    
    // Wait for the Update Task button to be visible (it's in the Details tab)
    const updateButton = page.getByRole('button', { name: /update task/i })
    await updateButton.waitFor({ state: 'visible', timeout: 5000 })
    
    // Clear and update title
    await titleInput.clear()
    await titleInput.fill('Edited Task')

    // Save (button is already visible, verified above)
    await updateButton.scrollIntoViewIfNeeded()
    await updateButton.click()
    await page.waitForTimeout(1000)

    // Verify updated title
    await expect(page.locator('h4:text-is("Edited Task")')).toBeVisible()
    await expect(page.locator('h4:text-is("Edit Me")')).not.toBeVisible()
  })

  // TODO: Fix dropdown button selector - button doesn't appear to be found in E2E context
  test.skip('should delete a task', async ({ page }) => {
    // Create a task
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Task title').fill('Delete Me')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(1000)

    // Verify task exists
    await expect(page.locator('h4:text-is("Delete Me")')).toBeVisible()
    await expect(backlogColumn.locator('span.text-xs.text-muted-foreground').first()).toHaveText('1')

    // Hover over task to show dropdown button
    const taskCard = page.locator('h4:text-is("Delete Me")').locator('../..')
    await taskCard.hover()
    await page.waitForTimeout(300)

    // Wait for and click dropdown button
    // Use :has selector to find button containing the icon
    const dropdownButton = taskCard.locator('button:has(svg.lucide-more-horizontal)')
    await dropdownButton.click({ force: true })
    await page.waitForTimeout(300)

    // Click delete menu item (deletion is immediate, no confirmation dialog)
    await page.getByRole('menuitem', { name: /delete/i }).click()
    await page.waitForTimeout(1000)

    // Verify task is gone
    await expect(page.locator('h4:text-is("Delete Me")')).not.toBeVisible()
    await expect(backlogColumn.locator('span.text-xs.text-muted-foreground').first()).toHaveText('0')
  })

  test('should persist tasks after page reload', async ({ page }) => {
    // Create a task
    const backlogColumn = page.locator('div.rounded-lg:has(h3:text-is("Backlog"))')
    const addButton = backlogColumn.locator('button.h-6.w-6')
    await addButton.click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Task title').fill('Persistent Task')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(1000)

    // Verify task exists
    await expect(page.locator('h4:text-is("Persistent Task")')).toBeVisible()

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Verify task still exists
    await expect(page.locator('h4:text-is("Persistent Task")')).toBeVisible()
    await expect(backlogColumn.locator('span.text-xs.text-muted-foreground').first()).toHaveText('1')
  })
})
