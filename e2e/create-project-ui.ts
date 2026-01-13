import { type Page } from '@playwright/test'

/**
 * Create a test project through the UI
 * More reliable than localStorage seeding as it uses actual user workflows
 */
export async function createProjectViaUI(page: Page, projectName: string = 'Test Project') {
  // Navigate to projects page
  await page.goto('http://localhost:3000/projects')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  
  // Click "New Project" button
  await page.getByRole('button', { name: /new project/i }).click()
  await page.waitForTimeout(500)
  
  // Fill project name
  await page.getByPlaceholder(/enter project name/i).fill(projectName)
  
  // Color is already pre-selected (default: blue), so we don't need to change it
  
  // Click "Create Project" button
  await page.getByRole('button', { name: /^create project$/i }).click()
  await page.waitForTimeout(1000)
  
  // Navigate back to board
  await page.goto('http://localhost:3000/board')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
}
