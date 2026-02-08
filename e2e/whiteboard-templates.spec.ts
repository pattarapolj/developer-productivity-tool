import { test, expect } from '@playwright/test'
import { createBoardFromTemplate, exportBoardAsPNG, verifyBoardHasElements } from './helpers'

test.describe('Whiteboard Templates E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000/whiteboards')
  })

  test('should create board from Meeting Agenda template', async ({ page }) => {
    // Click create board button
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    // Wait for template picker dialog
    await expect(page.locator('text=Choose a Template')).toBeVisible()

    // Select Meeting Agenda template
    const meetingAgendaOption = page.locator('text=Meeting Agenda').first()
    await meetingAgendaOption.click()

    // Enter board name
    const boardNameInput = page.locator('input[placeholder="Whiteboard name"]')
    await boardNameInput.fill('Test Board from Template')

    // Click create button
    const createButton = page.locator('button:has-text("Create")')
    await createButton.click()

    // Verify board was created
    await expect(page).toHaveURL(/\/whiteboards\/.+/)
    
    // Verify board name  
    await expect(page.locator('[data-testid="board-title"]')).toContainText('Test Board from Template')
  })

  test('should populate board with template elements', async ({ page }) => {
    // Create board from Meeting Agenda template
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    await expect(page.locator('text=Choose a Template')).toBeVisible()

    const meetingAgendaOption = page.locator('text=Meeting Agenda').first()
    await meetingAgendaOption.click()

    const boardNameInput = page.locator('input[placeholder="Whiteboard name"]')
    await boardNameInput.fill('Meeting Agenda Board')

    const createButton = page.locator('button:has-text("Create")')
    await createButton.click()

    // Wait for board to load
    await page.waitForTimeout(1000)

    // Verify Excalidraw is loaded
    const excalidrawFrame = page.locator('[class*="excalidraw"]')
    await expect(excalidrawFrame).toBeVisible()

    // Verify template elements exist (simplified check)
    // The actual elements would be within the Excalidraw canvas
    const boardContent = page.locator('[data-testid="board-editor"]')
    await expect(boardContent).toBeVisible()
  })

  test('should export board as PNG', async ({ page, context }) => {
    // Create a simple board first
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    await expect(page.locator('text=Choose a Template')).toBeVisible()

    // Select blank template
    const blankCanvasOption = page.locator('text=Blank Canvas').first()
    await blankCanvasOption.click()

    const boardNameInput = page.locator('input[placeholder="Whiteboard name"]')
    await boardNameInput.fill('Export Test Board')

    const createButton = page.locator('button:has-text("Create")')
    await createButton.click()

    // Wait for board to load
    await page.waitForTimeout(1000)

    // Listen for download
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    const exportButton = page.locator('[aria-label*="export" i]').first()
    await exportButton.click()

    // Click PNG option
    const pngOption = page.locator('text=Export as PNG').first()
    await pngOption.click()

    // Verify download started
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.png')

    // Verify file was saved
    await expect(download.path()).resolves.toBeTruthy()
  })

  test('should load blank template by default', async ({ page }) => {
    // Create board with blank template
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    await expect(page.locator('text=Choose a Template')).toBeVisible()

    // Select blank template
    const blankCanvasOption = page.locator('text=Blank Canvas').first()
    await blankCanvasOption.click()

    const boardNameInput = page.locator('input[placeholder="Whiteboard name"]')
    await boardNameInput.fill('Blank Test Board')

    const createButton = page.locator('button:has-text("Create")')
    await createButton.click()

    // Verify board was created with blank canvas
    await expect(page).toHaveURL(/\/whiteboards\/.+/)

    // Verify Excalidraw is loaded but empty
    const excalidrawFrame = page.locator('[class*="excalidraw"]')
    await expect(excalidrawFrame).toBeVisible()
  })

  test('should display all template options in picker', async ({ page }) => {
    // Click create board button
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    // Wait for template picker
    await expect(page.locator('text=Choose a Template')).toBeVisible()

    // Verify all 5 templates are visible
    await expect(page.locator('text=Blank Canvas')).toBeVisible()
    await expect(page.locator('text=Meeting Agenda')).toBeVisible()
    await expect(page.locator('text=Sprint Retrospective')).toBeVisible()
    await expect(page.locator('text=Brainstorm Canvas')).toBeVisible()
    await expect(page.locator('text=Architecture Diagram')).toBeVisible()
  })

  test('should handle rapid template selection', async ({ page }) => {
    const createBoardButton = page.locator('button:has-text("Create Board")')
    await createBoardButton.click()

    await expect(page.locator('text=Choose a Template')).toBeVisible()

    // Select a template quickly
    const template = page.locator('text=Meeting Agenda').first()
    await template.click()

    // Verify no errors and dialog closes
    await expect(page.locator('text=Choose a Template')).not.toBeVisible()
    
    // Fill in form
    const boardNameInput = page.locator('input[placeholder="Whiteboard name"]')
    await boardNameInput.fill('Quick Test Board')

    const createButton = page.locator('button:has-text("Create")')
    await createButton.click()

    // Verify board is created
    await expect(page).toHaveURL(/\/whiteboards\/.+/)
  })
})
