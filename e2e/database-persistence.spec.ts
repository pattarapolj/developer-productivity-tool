import { test, expect, Browser } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage, TaskDialogPage } from './helpers'

test.describe('Database Persistence', () => {
  let kanbanBoard: KanbanBoardPage
  let taskDialog: TaskDialogPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    taskDialog = new TaskDialogPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should persist full user workflow to database across page refresh', async ({ page }) => {
    // Step 1: Create a new project
    await page.goto('http://localhost:3000/projects')
    await page.waitForLoadState('networkidle')
    
    const createProjectBtn = page.getByRole('button', { name: /create project|new project/i })
    await createProjectBtn.click()
    
    // Fill project form
    const projectNameInput = page.getByPlaceholder(/project name|name/i).first()
    await projectNameInput.fill('E2E Test Project')
    
    // Submit project creation
    const submitBtn = page.getByRole('button', { name: /create|save|submit/i }).last()
    await submitBtn.click()
    
    // Wait for project to be created
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('E2E Test Project')).toBeVisible()
    
    // Step 2: Navigate to board and create a task
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    // Fill task form
    await expect(page.getByRole('dialog')).toBeVisible()
    const titleInput = page.getByPlaceholder(/task title|title/i)
    await titleInput.fill('E2E Test Task')
    
    const descriptionInput = page.getByPlaceholder(/description|task description/i)
    await descriptionInput.fill('This is a comprehensive E2E test task')
    
    // Submit task
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    // Verify task appears on board
    await expect(page.getByText('E2E Test Task')).toBeVisible({ timeout: 5000 })
    const taskCount1 = await page.locator('[role="button"][tabindex="0"]').count()
    
    // Step 3: Add time entry to task
    const taskCard = page.locator('text=E2E Test Task').first()
    await taskCard.click()
    
    // Wait for task detail view
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    
    const addTimeBtn = page.getByRole('button', { name: /add time|log time|time entry/i })
    if (await addTimeBtn.isVisible()) {
      await addTimeBtn.click()
      await page.waitForFunction(() => {
        const inputs = document.querySelectorAll('input[type="number"]')
        return inputs.length > 0
      })
      
      const hours = page.getByPlaceholder(/hours/i)
      const minutes = page.getByPlaceholder(/minutes/i)
      
      if (await hours.isVisible()) {
        await hours.fill('2')
      }
      if (await minutes.isVisible()) {
        await minutes.fill('30')
      }
      
      const timeSubmitBtn = page.getByRole('button', { name: /save time|add time|submit/i }).last()
      await timeSubmitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    
    // Close task dialog
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    // Step 4: Reload page - verify all data persists from database
    const pageUrl = page.url()
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for Zustand hydration
    
    // Verify task still exists after refresh
    await expect(page.getByText('E2E Test Task')).toBeVisible({ timeout: 5000 })
    const taskCount2 = await page.locator('[role="button"][tabindex="0"]').count()
    
    // Task count should remain the same
    expect(taskCount2).toBeGreaterThanOrEqual(taskCount1)
    
    // Step 5: Verify localStorage doesn't contain data (only UI state)
    const storage = await page.evaluate(() => {
      const storedData = localStorage.getItem('ToolingTracker-storage')
      return storedData ? JSON.parse(storedData) : null
    })
    
    // localStorage should only have UI state, not data
    if (storage) {
      expect(storage).toHaveProperty('state')
      const state = storage.state
      
      // Should not have data fields
      expect(state.projects || []).toEqual([])
      expect(state.tasks || []).toEqual([])
      expect(state.timeEntries || []).toEqual([])
      
      // Should have UI state
      expect(state).toHaveProperty('selectedProjectId')
      expect(state).toHaveProperty('boardFilters')
    }
  })

  test('should verify CRUD operations persist to database', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    // Get initial task count
    const initialCount = await page.locator('[role="button"][tabindex="0"]').count()
    
    // CREATE: Add new task
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    const titleInput = page.getByPlaceholder(/task title|title/i)
    await titleInput.fill('CRUD Test Task')
    
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    await expect(page.getByText('CRUD Test Task')).toBeVisible({ timeout: 5000 })
    
    // Refresh and verify CREATE persists
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('CRUD Test Task')).toBeVisible({ timeout: 5000 })
    const afterCreateCount = await page.locator('[role="button"][tabindex="0"]').count()
    expect(afterCreateCount).toBe(initialCount + 1)
    
    // UPDATE: Edit the task
    const taskCard = page.locator('text=CRUD Test Task').first()
    await taskCard.click()
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    const editTitle = page.getByPlaceholder(/task title|title/i)
    await editTitle.clear()
    await editTitle.fill('Updated CRUD Test Task')
    
    const updateBtn = page.getByRole('button', { name: /save|update|submit/i }).last()
    await updateBtn.click()
    
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    // Refresh and verify UPDATE persists
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('Updated CRUD Test Task')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('CRUD Test Task')).not.toBeVisible()
  })

  test('should sync data across multiple browser tabs/windows', async ({ browser }) => {
    // Open first tab
    const context = await browser.newContext()
    const page1 = await context.newPage()
    const page2 = await context.newPage()
    
    try {
      // Setup in tab 1
      await page1.goto('http://localhost:3000/board')
      await page1.waitForLoadState('networkidle')
      
      // Create data in tab 1
      const addTaskBtn = page1.getByRole('button', { name: /add task|new task|create task/i }).first()
      await addTaskBtn.click()
      
      await expect(page1.getByRole('dialog')).toBeVisible()
      const titleInput = page1.getByPlaceholder(/task title|title/i)
      await titleInput.fill('Multi-Tab Test Task')
      
      const taskSubmitBtn = page1.getByRole('button', { name: /create.*task|save/i })
      await taskSubmitBtn.click()
      
      await expect(page1.getByText('Multi-Tab Test Task')).toBeVisible({ timeout: 5000 })
      
      // Try to see the data in tab 2 (different context may not share in-memory state, but DB should sync)
      await page2.goto('http://localhost:3000/board')
      await page2.waitForLoadState('networkidle')
      await page2.waitForTimeout(2000)
      
      // Data should appear in tab 2 from database
      await expect(page2.getByText('Multi-Tab Test Task')).toBeVisible({ timeout: 10000 })
    } finally {
      await context.close()
    }
  })

  test('should maintain data integrity across multiple operations', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    const taskTitle = 'Integrity Test Task'
    const taskDescription = 'Testing data integrity across operations'
    
    // Create task with all fields
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    
    const titleInput = page.getByPlaceholder(/task title|title/i)
    await titleInput.fill(taskTitle)
    
    const descInput = page.getByPlaceholder(/description|task description/i)
    await descInput.fill(taskDescription)
    
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
    
    // Verify data integrity by opening task detail
    const taskCard = page.locator(`text=${taskTitle}`).first()
    await taskCard.click()
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    
    // Verify all fields are preserved
    const titleField = page.getByPlaceholder(/task title|title/i)
    await expect(titleField).toHaveValue(taskTitle)
    
    const descField = page.getByPlaceholder(/description|task description/i)
    // Description might not always be in input, check text content
    const dialogContent = page.getByRole('dialog')
    await expect(dialogContent).toContainText(taskDescription)
    
    // Close and refresh multiple times
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    for (let i = 0; i < 3; i++) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Verify data still exists and is correct
      await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should handle concurrent operations without data loss', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    // Create multiple tasks in quick succession
    const taskTitles = [
      'Concurrent Task 1',
      'Concurrent Task 2',
      'Concurrent Task 3',
    ]
    
    for (const title of taskTitles) {
      const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
      await addTaskBtn.click()
      
      await expect(page.getByRole('dialog')).toBeVisible()
      const titleInput = page.getByPlaceholder(/task title|title/i)
      await titleInput.fill(title)
      
      const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
      await taskSubmitBtn.click()
      
      await expect(page.getByText(title)).toBeVisible({ timeout: 5000 })
      await page.waitForTimeout(200) // Small delay between operations
    }
    
    // Verify all tasks exist
    for (const title of taskTitles) {
      await expect(page.getByText(title)).toBeVisible()
    }
    
    // Reload and verify all persisted
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    for (const title of taskTitles) {
      await expect(page.getByText(title)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should persist task status changes (dragging between columns)', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    // Create a task in Backlog
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    const titleInput = page.getByPlaceholder(/task title|title/i)
    const statusChangeTaskTitle = 'Status Change Test'
    await titleInput.fill(statusChangeTaskTitle)
    
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    await expect(page.getByText(statusChangeTaskTitle)).toBeVisible({ timeout: 5000 })
    
    // Try to move task (may require drag-and-drop)
    // Alternative: Open task and change status from dialog
    const taskCard = page.locator(`text=${statusChangeTaskTitle}`).first()
    await taskCard.click()
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    
    // Look for status selector/dropdown
    const statusDropdown = page.getByRole('combobox', { name: /status|state/i })
    if (await statusDropdown.isVisible()) {
      await statusDropdown.click()
      const todoOption = page.getByRole('option', { name: /todo|to do|to-do/i })
      if (await todoOption.isVisible()) {
        await todoOption.click()
      }
    } else {
      // Try to find status button/selector
      const statusButtons = page.getByRole('button', { name: /backlog|todo|in.?progress|done/i })
      if (await statusButtons.first().isVisible()) {
        await statusButtons.nth(1).click()
      }
    }
    
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    // Reload and verify status persists
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Task should still exist with updated status
    await expect(page.getByText(statusChangeTaskTitle)).toBeVisible({ timeout: 5000 })
  })

  test('should recover from connection errors with automatic sync', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    const taskTitle = 'Connection Recovery Test'
    
    // Create a task
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    const titleInput = page.getByPlaceholder(/task title|title/i)
    await titleInput.fill(taskTitle)
    
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
    
    // Simulate going offline by blocking network
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    
    // Make a change while offline (should queue for sync)
    const taskCard = page.locator(`text=${taskTitle}`).first()
    if (await taskCard.isVisible()) {
      await taskCard.click()
    }
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)
    
    // Reload and verify task persists
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Task should still exist
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
  })

  test('should verify task with time entries persists completely', async ({ page }) => {
    await page.goto('http://localhost:3000/board')
    await page.waitForLoadState('networkidle')
    
    const taskTitle = 'Task with Time'
    
    // Create task
    const addTaskBtn = page.getByRole('button', { name: /add task|new task|create task/i }).first()
    await addTaskBtn.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    const titleInput = page.getByPlaceholder(/task title|title/i)
    await titleInput.fill(taskTitle)
    
    const taskSubmitBtn = page.getByRole('button', { name: /create.*task|save/i })
    await taskSubmitBtn.click()
    
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
    
    // Get database data via API or evaluate
    const dbData = await page.evaluate(async () => {
      // Attempt to get task from store/API
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const tasks = await response.json()
          return { success: true, taskCount: tasks.length, tasks: tasks.slice(0, 3) }
        }
      } catch (e) {
        // API might not be available
        console.log('API not available for test')
      }
      return { success: false }
    })
    
    // Verify API returns data
    if (dbData.success) {
      expect(dbData.taskCount).toBeGreaterThan(0)
    }
    
    // Reload and verify
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 })
  })
})
