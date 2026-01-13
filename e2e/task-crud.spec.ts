import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage, TaskDialogPage } from './helpers'

test.describe('Task CRUD Operations', () => {
  let kanbanBoard: KanbanBoardPage
  let taskDialog: TaskDialogPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    taskDialog = new TaskDialogPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should create a new task in Backlog', async ({ page }) => {
    // Open add task dialog for Backlog
    await kanbanBoard.openAddTaskDialog('backlog')

    // Verify dialog opened
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Create Task')).toBeVisible()

    // Fill in task details
    await taskDialog.fillTitle('New test task')
    await taskDialog.fillDescription('This is a test task description')
    await taskDialog.selectProject('Frontend Refactor')
    await taskDialog.selectPriority('Medium')
    await taskDialog.fillStoryPoints(3)

    // Submit the form
    await taskDialog.submit()

    // Verify dialog closed
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Verify task appears in Backlog
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('New test task')).toBeVisible()

    // Verify task count increased
    expect(await kanbanBoard.getTaskCount('backlog')).toBe(2)
  })

  test('should create a new task in To Do column', async ({ page }) => {
    const initialCount = await kanbanBoard.getTaskCount('todo')

    await kanbanBoard.openAddTaskDialog('todo')
    
    await taskDialog.fillTitle('Another test task')
    await taskDialog.selectProject('API Integration')
    await taskDialog.selectPriority('Low')
    await taskDialog.submit()

    // Verify task appears in To Do
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Another test task')).toBeVisible()
    
    expect(await kanbanBoard.getTaskCount('todo')).toBe(initialCount + 1)
  })

  test('should edit an existing task', async ({ page }) => {
    // Click on existing task to open edit dialog
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    await taskCard.click()

    // Verify edit dialog opened
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Edit Task')).toBeVisible()

    // Verify existing values are pre-filled
    await expect(page.getByPlaceholder('Task title')).toHaveValue('Refactor login component')

    // Update task title
    await taskDialog.fillTitle('Updated: Refactor login component')
    await taskDialog.submit()

    // Verify dialog closed
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Verify updated task appears
    await expect(page.getByText('Updated: Refactor login component')).toBeVisible()
  })

  test('should cancel task creation', async ({ page }) => {
    const initialCount = await kanbanBoard.getTaskCount('backlog')

    await kanbanBoard.openAddTaskDialog('backlog')
    
    await taskDialog.fillTitle('Task to be cancelled')
    await taskDialog.cancel()

    // Verify dialog closed
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Verify task was not created
    await expect(page.getByText('Task to be cancelled')).not.toBeVisible()
    expect(await kanbanBoard.getTaskCount('backlog')).toBe(initialCount)
  })

  test('should require task title', async ({ page }) => {
    await kanbanBoard.openAddTaskDialog('backlog')

    // Try to submit without title
    await taskDialog.selectProject('Frontend Refactor')
    await taskDialog.submit()

    // Dialog should still be open (validation failed)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should archive a task', async ({ page }) => {
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    
    // Hover to show menu button
    await taskCard.hover()
    
    // Click dropdown menu
    const menuButton = taskCard.getByRole('button', { name: /more options/i })
    await menuButton.click()

    // Click archive
    await page.getByRole('menuitem', { name: /archive/i }).click()

    // Verify task is no longer visible
    await expect(taskCard).not.toBeVisible()

    // Verify count decreased
    expect(await kanbanBoard.getTaskCount('backlog')).toBe(0)
  })

  test('should delete a task', async ({ page }) => {
    const initialCount = await kanbanBoard.getTaskCount('todo')
    const taskCard = await kanbanBoard.getTaskCard('Implement GraphQL client')
    
    // Open dropdown menu
    await taskCard.hover()
    await taskCard.getByRole('button', { name: /more options/i }).click()

    // Click delete
    await page.getByRole('menuitem', { name: /delete/i }).click()

    // Confirm deletion in alert dialog
    await page.getByRole('button', { name: /delete/i }).click()

    // Verify task removed
    await expect(taskCard).not.toBeVisible()
    expect(await kanbanBoard.getTaskCount('todo')).toBe(initialCount - 1)
  })

  test('should navigate to task detail page', async ({ page }) => {
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    
    // Click on task card
    await taskCard.click()

    // Wait for navigation or dialog
    await page.waitForLoadState('networkidle')

    // Should open edit dialog (current behavior) or navigate to detail page
    // Verify we can interact with task details
    await expect(page.getByText('Refactor login component')).toBeVisible()
  })

  test('should create task with all optional fields', async ({ page }) => {
    await kanbanBoard.openAddTaskDialog('backlog')

    await taskDialog.fillTitle('Comprehensive test task')
    await taskDialog.fillDescription('# Task Description\n\nThis has **markdown** support')
    await taskDialog.selectProject('Frontend Refactor')
    await taskDialog.selectPriority('High')
    await taskDialog.fillStoryPoints(8)
    
    // Fill subcategory (if visible)
    const subcategoryInput = page.getByPlaceholder(/subcategory/i)
    if (await subcategoryInput.isVisible()) {
      await subcategoryInput.fill('Testing')
    }

    await taskDialog.submit()

    // Verify task created with all fields
    const taskCard = await kanbanBoard.getTaskCard('Comprehensive test task')
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('High')
    await expect(taskCard).toContainText('8 pts')
  })
})
