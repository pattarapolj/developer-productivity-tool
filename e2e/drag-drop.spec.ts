import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage } from './helpers'

test.describe('Task Drag and Drop', () => {
  let kanbanBoard: KanbanBoardPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should drag task from Backlog to To Do', async ({ page }) => {
    // Verify initial state
    const backlogCount = await kanbanBoard.getTaskCount('backlog')
    const todoCount = await kanbanBoard.getTaskCount('todo')
    
    expect(backlogCount).toBe(1)
    expect(todoCount).toBe(1)

    // Find the task card in Backlog
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    await expect(taskCard).toBeVisible()

    // Drag to To Do column
    await kanbanBoard.dragTaskToColumn('Refactor login component', 'todo')

    // Wait for the drag operation to complete
    await page.waitForTimeout(500)

    // Verify counts changed
    const newBacklogCount = await kanbanBoard.getTaskCount('backlog')
    const newTodoCount = await kanbanBoard.getTaskCount('todo')

    expect(newBacklogCount).toBe(0)
    expect(newTodoCount).toBe(2)

    // Verify task appears in To Do column
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Refactor login component')).toBeVisible()
  })

  test('should drag task from To Do to In Progress', async ({ page }) => {
    // Get initial counts
    const todoCount = await kanbanBoard.getTaskCount('todo')
    const inProgressCount = await kanbanBoard.getTaskCount('in-progress')

    expect(todoCount).toBe(1)
    expect(inProgressCount).toBe(1)

    // Drag task
    await kanbanBoard.dragTaskToColumn('Implement GraphQL client', 'in-progress')
    await page.waitForTimeout(500)

    // Verify new counts
    expect(await kanbanBoard.getTaskCount('todo')).toBe(0)
    expect(await kanbanBoard.getTaskCount('in-progress')).toBe(2)

    // Verify task moved
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')
    await expect(inProgressColumn.getByText('Implement GraphQL client')).toBeVisible()
  })

  test('should drag task from In Progress to Done', async ({ page }) => {
    // Get initial counts
    const inProgressCount = await kanbanBoard.getTaskCount('in-progress')
    const doneCount = await kanbanBoard.getTaskCount('done')

    expect(inProgressCount).toBe(1)
    expect(doneCount).toBe(0)

    // Drag task to Done
    await kanbanBoard.dragTaskToColumn('Optimize bundle size', 'done')
    await page.waitForTimeout(500)

    // Verify counts
    expect(await kanbanBoard.getTaskCount('in-progress')).toBe(0)
    expect(await kanbanBoard.getTaskCount('done')).toBe(1)

    // Verify task completed
    const doneColumn = await kanbanBoard.getColumn('done')
    await expect(doneColumn.getByText('Optimize bundle size')).toBeVisible()
  })

  test('should drag task backwards from To Do to Backlog', async ({ page }) => {
    const todoCount = await kanbanBoard.getTaskCount('todo')
    const backlogCount = await kanbanBoard.getTaskCount('backlog')

    expect(todoCount).toBe(1)
    expect(backlogCount).toBe(1)

    // Drag task back to Backlog
    await kanbanBoard.dragTaskToColumn('Implement GraphQL client', 'backlog')
    await page.waitForTimeout(500)

    // Verify counts
    expect(await kanbanBoard.getTaskCount('todo')).toBe(0)
    expect(await kanbanBoard.getTaskCount('backlog')).toBe(2)
  })

  test('should persist task status after page reload', async ({ page }) => {
    // Move task to Done
    await kanbanBoard.dragTaskToColumn('Optimize bundle size', 'done')
    await page.waitForTimeout(500)

    // Verify it's in Done
    expect(await kanbanBoard.getTaskCount('done')).toBe(1)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify task is still in Done
    expect(await kanbanBoard.getTaskCount('done')).toBe(1)
    const doneColumn = await kanbanBoard.getColumn('done')
    await expect(doneColumn.getByText('Optimize bundle size')).toBeVisible()
  })

  test('should show correct task details in cards', async ({ page }) => {
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')

    // Verify task card shows expected information
    await expect(taskCard).toContainText('Refactor login component')
    await expect(taskCard).toContainText('High')
    await expect(taskCard).toContainText('FE-101')
    await expect(taskCard).toContainText('5 pts')
  })
})
