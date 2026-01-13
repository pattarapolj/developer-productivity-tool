import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage, TimeEntryDialogPage } from './helpers'

test.describe('Time Tracking', () => {
  let kanbanBoard: KanbanBoardPage
  let timeEntryDialog: TimeEntryDialogPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    timeEntryDialog = new TimeEntryDialogPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should log time for a task', async ({ page }) => {
    // Open time entry dialog
    await timeEntryDialog.open('Refactor login component')

    // Verify dialog opened
    await expect(page.getByText('Log Time')).toBeVisible()

    // Fill time entry
    await timeEntryDialog.fillHours(3)
    await timeEntryDialog.fillMinutes(30)
    await timeEntryDialog.selectType('Development')
    await timeEntryDialog.fillNotes('Completed initial refactoring')

    // Submit
    await timeEntryDialog.submit()

    // Verify dialog closed
    await page.waitForTimeout(500)

    // Verify time appears on task card
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    await expect(taskCard).toContainText('3h 30m')
  })

  test('should log time with only hours', async ({ page }) => {
    await timeEntryDialog.open('Implement GraphQL client')

    await timeEntryDialog.fillHours(2)
    await timeEntryDialog.fillMinutes(0)
    await timeEntryDialog.selectType('Development')
    await timeEntryDialog.submit()

    await page.waitForTimeout(500)

    const taskCard = await kanbanBoard.getTaskCard('Implement GraphQL client')
    await expect(taskCard).toContainText('2h')
  })

  test('should log time with different entry types', async ({ page }) => {
    const types: Array<'Development' | 'Meeting' | 'Review' | 'Research' | 'Debugging'> = [
      'Development',
      'Meeting',
      'Review',
      'Research',
      'Debugging',
    ]

    for (const type of types) {
      // Reopen dialog
      await timeEntryDialog.open('Optimize bundle size')

      await timeEntryDialog.fillHours(1)
      await timeEntryDialog.fillMinutes(0)
      await timeEntryDialog.selectType(type)
      await timeEntryDialog.submit()

      await page.waitForTimeout(300)
    }

    // Verify cumulative time
    const taskCard = await kanbanBoard.getTaskCard('Optimize bundle size')
    // Should show 2h 30m (initial) + 5h (5 entries) = 7h 30m
    await expect(taskCard).toContainText('7h 30m')
  })

  test('should require time amount', async ({ page }) => {
    await timeEntryDialog.open('Refactor login component')

    // Try to submit without time
    await timeEntryDialog.selectType('Development')
    await timeEntryDialog.submit()

    // Dialog should stay open
    await expect(page.getByText('Log Time')).toBeVisible()
  })

  test('should show existing time entries for a task', async ({ page }) => {
    // Task already has 2h 30m logged
    const taskCard = await kanbanBoard.getTaskCard('Optimize bundle size')
    await expect(taskCard).toContainText('2h 30m')

    // Open time entry dialog
    await timeEntryDialog.open('Optimize bundle size')

    // Verify dialog shows existing entries
    await expect(page.getByText('2h 30m')).toBeVisible()
    await expect(page.getByText('Development')).toBeVisible()
    await expect(page.getByText('Analyzed bundle')).toBeVisible()
  })

  test('should edit an existing time entry', async ({ page }) => {
    await timeEntryDialog.open('Optimize bundle size')

    // Find and click edit button for existing entry
    const editButton = page.getByRole('button', { name: /edit.*time/i }).first()
    await editButton.click()

    // Update hours
    await timeEntryDialog.fillHours(3)
    await timeEntryDialog.fillMinutes(0)
    await page.getByRole('button', { name: /update time/i }).click()

    await page.waitForTimeout(500)

    // Verify updated time
    const taskCard = await kanbanBoard.getTaskCard('Optimize bundle size')
    await expect(taskCard).toContainText('3h')
  })

  test('should delete a time entry', async ({ page }) => {
    await timeEntryDialog.open('Optimize bundle size')

    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete.*time/i }).first()
    await deleteButton.click()

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click()

    await page.waitForTimeout(500)

    // Verify time removed from card
    const taskCard = await kanbanBoard.getTaskCard('Optimize bundle size')
    await expect(taskCard).not.toContainText('2h 30m')
  })

  test('should persist time entries after page reload', async ({ page }) => {
    // Log time
    await timeEntryDialog.open('Refactor login component')
    await timeEntryDialog.fillHours(4)
    await timeEntryDialog.fillMinutes(15)
    await timeEntryDialog.selectType('Development')
    await timeEntryDialog.submit()

    await page.waitForTimeout(500)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify time persisted
    const taskCard = await kanbanBoard.getTaskCard('Refactor login component')
    await expect(taskCard).toContainText('4h 15m')
  })

  test('should calculate total time across multiple entries', async ({ page }) => {
    // Log first entry
    await timeEntryDialog.open('Implement GraphQL client')
    await timeEntryDialog.fillHours(2)
    await timeEntryDialog.fillMinutes(30)
    await timeEntryDialog.selectType('Development')
    await timeEntryDialog.submit()
    await page.waitForTimeout(300)

    // Log second entry
    await timeEntryDialog.open('Implement GraphQL client')
    await timeEntryDialog.fillHours(1)
    await timeEntryDialog.fillMinutes(45)
    await timeEntryDialog.selectType('Review')
    await timeEntryDialog.submit()
    await page.waitForTimeout(300)

    // Verify total: 2h 30m + 1h 45m = 4h 15m
    const taskCard = await kanbanBoard.getTaskCard('Implement GraphQL client')
    await expect(taskCard).toContainText('4h 15m')
  })
})
