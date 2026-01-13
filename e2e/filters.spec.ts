import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage } from './helpers'

test.describe('Filters and Search', () => {
  let kanbanBoard: KanbanBoardPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should search tasks by title', async ({ page }) => {
    // Type search query
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('GraphQL')
    await page.waitForTimeout(500)

    // Verify only matching task visible
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()

    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).not.toBeVisible()

    const inProgressColumn = await kanbanBoard.getColumn('in-progress')
    await expect(inProgressColumn.getByText('Optimize bundle size')).not.toBeVisible()
  })

  test('should search tasks by JIRA key', async ({ page }) => {
    // Search by JIRA key
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('FE-101')
    await page.waitForTimeout(500)

    // Verify only matching task visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(backlogColumn.getByText('FE-101')).toBeVisible()

    // Verify other tasks hidden
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).not.toBeVisible()
  })

  test('should clear search filter', async ({ page }) => {
    // Search first
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('GraphQL')
    await page.waitForTimeout(500)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)

    // Verify all tasks visible again
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    const todoColumn = await kanbanBoard.getColumn('todo')
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')

    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()
    await expect(inProgressColumn.getByText('Optimize bundle size')).toBeVisible()
  })

  test('should filter by priority', async ({ page }) => {
    // Open priority filter
    await page.getByRole('button', { name: /priority/i }).click()

    // Select High priority
    await page.getByRole('option', { name: 'High' }).click()
    await page.waitForTimeout(500)

    // Verify only high priority task visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(backlogColumn.locator('[data-priority="high"]')).toBeVisible()

    // Verify other tasks hidden
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).not.toBeVisible()

    const inProgressColumn = await kanbanBoard.getColumn('in-progress')
    await expect(inProgressColumn.getByText('Optimize bundle size')).not.toBeVisible()
  })

  test('should filter by multiple priorities', async ({ page }) => {
    // Open priority filter
    await page.getByRole('button', { name: /priority/i }).click()

    // Select High and Medium priorities
    await page.getByRole('option', { name: 'High' }).click()
    await page.getByRole('option', { name: 'Medium' }).click()
    await page.waitForTimeout(500)

    // Verify high and medium priority tasks visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()

    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()

    // Verify low priority task hidden
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')
    await expect(inProgressColumn.getByText('Optimize bundle size')).not.toBeVisible()
  })

  test('should filter by date range', async ({ page }) => {
    // Open date range filter
    await page.getByRole('button', { name: /date range/i }).click()

    // Select "This Week"
    await page.getByRole('option', { name: /this week/i }).click()
    await page.waitForTimeout(500)

    // Verify only tasks due this week visible
    // Task "Refactor login component" is due in 7 days
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
  })

  test('should combine search and priority filter', async ({ page }) => {
    // Type search query
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('Refactor')
    await page.waitForTimeout(300)

    // Apply priority filter
    await page.getByRole('button', { name: /priority/i }).click()
    await page.getByRole('option', { name: 'High' }).click()
    await page.waitForTimeout(500)

    // Verify only task matching both filters visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()

    // Verify other tasks hidden
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).not.toBeVisible()

    const inProgressColumn = await kanbanBoard.getColumn('in-progress')
    await expect(inProgressColumn.getByText('Optimize bundle size')).not.toBeVisible()
  })

  test('should toggle archived tasks', async ({ page }) => {
    // Archive a task first
    const taskCard = await kanbanBoard.getTaskCard('Implement GraphQL client')
    await taskCard.hover()

    // Open dropdown menu
    await taskCard.getByRole('button', { name: /more options/i }).click()

    // Archive task
    await page.getByRole('menuitem', { name: /archive/i }).click()
    await page.waitForTimeout(500)

    // Verify task hidden by default
    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).not.toBeVisible()

    // Toggle "Show Archived"
    await page.getByRole('checkbox', { name: /show archived/i }).check()
    await page.waitForTimeout(500)

    // Verify archived task now visible
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()
    await expect(todoColumn.locator('[data-archived="true"]')).toBeVisible()
  })

  test('should clear all filters', async ({ page }) => {
    // Apply multiple filters
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('GraphQL')

    await page.getByRole('button', { name: /priority/i }).click()
    await page.getByRole('option', { name: 'Medium' }).click()
    await page.waitForTimeout(500)

    // Click "Clear Filters" button
    await page.getByRole('button', { name: /clear.*filters/i }).click()
    await page.waitForTimeout(500)

    // Verify all tasks visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    const todoColumn = await kanbanBoard.getColumn('todo')
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')

    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()
    await expect(inProgressColumn.getByText('Optimize bundle size')).toBeVisible()

    // Verify search input cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should persist filters after page reload', async ({ page }) => {
    // Apply search filter
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('GraphQL')
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify filter persisted
    await expect(searchInput).toHaveValue('GraphQL')

    const todoColumn = await kanbanBoard.getColumn('todo')
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()

    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).not.toBeVisible()
  })
})
