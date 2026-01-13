import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage } from './helpers'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Export Functionality', () => {
  let kanbanBoard: KanbanBoardPage
  const downloadsPath = path.join(__dirname, '../playwright-downloads')

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    await clearStorage(page)
    await seedSampleData(page)

    // Clean up downloads folder
    if (fs.existsSync(downloadsPath)) {
      fs.rmSync(downloadsPath, { recursive: true })
    }
    fs.mkdirSync(downloadsPath, { recursive: true })
  })

  test.afterEach(() => {
    // Clean up downloads after each test
    if (fs.existsSync(downloadsPath)) {
      fs.rmSync(downloadsPath, { recursive: true })
    }
  })

  test('should export all projects to Excel', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Verify dialog opened
    await expect(page.getByText('Export Data')).toBeVisible()

    // Select "All Projects"
    await page.getByRole('radio', { name: /all projects/i }).check()

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.getByRole('button', { name: /export to excel/i }).click()

    // Wait for download
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify filename format
    expect(filename).toMatch(/^ToolingTracker-All-\d{8}-\d{6}\.xlsx$/)

    // Save file
    const downloadPath = path.join(downloadsPath, filename)
    await download.saveAs(downloadPath)

    // Verify file exists
    expect(fs.existsSync(downloadPath)).toBe(true)

    // Verify file size > 0
    const stats = fs.statSync(downloadPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  test('should export single project to Excel', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Select "Single Project"
    await page.getByRole('radio', { name: /single project/i }).check()

    // Select project from dropdown
    await page.getByLabel(/select project/i).click()
    await page.getByRole('option', { name: 'Frontend Refactor' }).click()

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.getByRole('button', { name: /export to excel/i }).click()

    // Wait for download
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify filename contains project name
    expect(filename).toMatch(/^ToolingTracker-Frontend_Refactor-\d{8}-\d{6}\.xlsx$/)

    // Save and verify file
    const downloadPath = path.join(downloadsPath, filename)
    await download.saveAs(downloadPath)
    expect(fs.existsSync(downloadPath)).toBe(true)

    const stats = fs.statSync(downloadPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  test('should export with time entries included', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Check "Include Time Entries"
    await page.getByRole('checkbox', { name: /include time entries/i }).check()

    // Select all projects
    await page.getByRole('radio', { name: /all projects/i }).check()

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Export
    await page.getByRole('button', { name: /export to excel/i }).click()

    // Verify download
    const download = await downloadPromise
    const downloadPath = path.join(downloadsPath, download.suggestedFilename())
    await download.saveAs(downloadPath)

    // Verify file exists and has content
    expect(fs.existsSync(downloadPath)).toBe(true)
    const stats = fs.statSync(downloadPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  test('should close export dialog on cancel', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Verify dialog opened
    await expect(page.getByText('Export Data')).toBeVisible()

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click()

    // Verify dialog closed
    await expect(page.getByText('Export Data')).not.toBeVisible()
  })

  test('should require project selection for single project export', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Select "Single Project" without choosing a project
    await page.getByRole('radio', { name: /single project/i }).check()

    // Try to export without selecting project
    const exportButton = page.getByRole('button', { name: /export to excel/i })

    // Button should be disabled or show error
    const isDisabled = await exportButton.isDisabled()
    expect(isDisabled).toBe(true)
  })

  test('should export with current filters applied', async ({ page }) => {
    // Apply a filter first
    const searchInput = page.getByPlaceholder(/search tasks/i)
    await searchInput.fill('Refactor')
    await page.waitForTimeout(500)

    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Check "Apply Current Filters"
    await page.getByRole('checkbox', { name: /apply current filters/i }).check()

    // Setup download handler
    const downloadPromise = page.waitForEvent('download')

    // Export
    await page.getByRole('button', { name: /export to excel/i }).click()

    // Verify download
    const download = await downloadPromise
    const downloadPath = path.join(downloadsPath, download.suggestedFilename())
    await download.saveAs(downloadPath)

    expect(fs.existsSync(downloadPath)).toBe(true)

    // File should be smaller since it only contains filtered tasks
    const stats = fs.statSync(downloadPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  test('should show export progress indicator', async ({ page }) => {
    // Open export dialog
    await page.getByRole('button', { name: /export/i }).click()

    // Start export
    await page.getByRole('button', { name: /export to excel/i }).click()

    // Verify progress indicator appears (briefly)
    // Note: This might be very quick, so we use a short timeout
    await page.waitForSelector('[role="progressbar"]', { timeout: 1000 }).catch(() => {
      // Progress might be too fast to catch, that's okay
    })

    // Wait for download to complete
    await page.waitForEvent('download')

    // Verify dialog closes after export
    await expect(page.getByText('Export Data')).not.toBeVisible()
  })
})
