import { test, expect } from '@playwright/test'
import { clearStorage, seedSampleData, KanbanBoardPage, SidebarPage } from './helpers'

test.describe('Project Management', () => {
  let kanbanBoard: KanbanBoardPage
  let sidebar: SidebarPage

  test.beforeEach(async ({ page }) => {
    kanbanBoard = new KanbanBoardPage(page)
    sidebar = new SidebarPage(page)
    await clearStorage(page)
    await seedSampleData(page)
  })

  test('should filter tasks by project', async ({ page }) => {
    // Initially shows all tasks (3 tasks)
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    const todoColumn = await kanbanBoard.getColumn('todo')
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')

    let backlogCount = await kanbanBoard.getTaskCount('backlog')
    let todoCount = await kanbanBoard.getTaskCount('todo')
    let inProgressCount = await kanbanBoard.getTaskCount('in-progress')

    expect(backlogCount + todoCount + inProgressCount).toBe(3)

    // Filter by Frontend Refactor project
    await sidebar.selectProject('Frontend Refactor')
    await page.waitForTimeout(500)

    // Verify only Frontend Refactor tasks visible
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(inProgressColumn.getByText('Optimize bundle size')).toBeVisible()
    await expect(todoColumn.getByText('Implement GraphQL client')).not.toBeVisible()

    // Verify task counts
    backlogCount = await kanbanBoard.getTaskCount('backlog')
    inProgressCount = await kanbanBoard.getTaskCount('in-progress')
    expect(backlogCount + inProgressCount).toBe(2)
  })

  test('should show all projects by default', async ({ page }) => {
    // Select "All Projects"
    await sidebar.selectAllProjects()
    await page.waitForTimeout(500)

    // Verify all tasks visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    const todoColumn = await kanbanBoard.getColumn('todo')
    const inProgressColumn = await kanbanBoard.getColumn('in-progress')

    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
    await expect(todoColumn.getByText('Implement GraphQL client')).toBeVisible()
    await expect(inProgressColumn.getByText('Optimize bundle size')).toBeVisible()
  })

  test('should create a new project', async ({ page }) => {
    // Open add project dialog
    await sidebar.openAddProjectDialog()

    // Verify dialog opened
    await expect(page.getByText('Create Project')).toBeVisible()

    // Fill project form
    await page.getByPlaceholder('Project name').fill('Backend Refactor')
    await page.getByPlaceholder('Optional JIRA key').fill('BACKEND')

    // Select color
    await page.getByLabel('Color').click()
    await page.getByRole('option', { name: 'Red' }).click()

    // Add subcategories
    await page.getByPlaceholder('Add subcategory').fill('Authentication')
    await page.keyboard.press('Enter')
    await page.getByPlaceholder('Add subcategory').fill('Database')
    await page.keyboard.press('Enter')

    // Submit
    await page.getByRole('button', { name: /create project/i }).click()

    await page.waitForTimeout(500)

    // Verify project appears in sidebar
    await expect(page.getByText('Backend Refactor')).toBeVisible()
  })

  test('should edit a project', async ({ page }) => {
    // Click on project to edit
    const projectItem = page.locator('[data-project="Frontend Refactor"]').first()
    await projectItem.click({ button: 'right' })

    // Click edit option
    await page.getByRole('menuitem', { name: /edit/i }).click()

    // Verify edit dialog opened
    await expect(page.getByText('Edit Project')).toBeVisible()

    // Update name
    await page.getByPlaceholder('Project name').clear()
    await page.getByPlaceholder('Project name').fill('Frontend Redesign')

    // Update JIRA key
    await page.getByPlaceholder('Optional JIRA key').clear()
    await page.getByPlaceholder('Optional JIRA key').fill('FED')

    // Submit
    await page.getByRole('button', { name: /save/i }).click()

    await page.waitForTimeout(500)

    // Verify updated name appears
    await expect(page.getByText('Frontend Redesign')).toBeVisible()
    await expect(page.getByText('Frontend Refactor')).not.toBeVisible()
  })

  test('should delete a project', async ({ page }) => {
    // Initial project count
    const initialProjects = await page.locator('[data-testid^="project-"]').count()

    // Right-click project
    const projectItem = page.locator('[data-project="API Integration"]').first()
    await projectItem.click({ button: 'right' })

    // Click delete
    await page.getByRole('menuitem', { name: /delete/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click()

    await page.waitForTimeout(500)

    // Verify project removed
    await expect(page.getByText('API Integration')).not.toBeVisible()

    // Verify project count decreased
    const finalProjects = await page.locator('[data-testid^="project-"]').count()
    expect(finalProjects).toBe(initialProjects - 1)
  })

  test('should show project color indicators', async ({ page }) => {
    // Verify Frontend Refactor has blue color
    const frontendProject = page.locator('[data-project="Frontend Refactor"]').first()
    await expect(frontendProject).toHaveCSS('--project-color', /blue/)

    // Verify API Integration has green color
    const apiProject = page.locator('[data-project="API Integration"]').first()
    await expect(apiProject).toHaveCSS('--project-color', /green/)
  })

  test('should navigate between views', async ({ page }) => {
    // Navigate to Analytics
    await sidebar.navigateTo('Analytics')
    await expect(page).toHaveURL(/\/analytics/)

    // Navigate to Calendar
    await sidebar.navigateTo('Calendar')
    await expect(page).toHaveURL(/\/calendar/)

    // Navigate back to Board
    await sidebar.navigateTo('Board')
    await expect(page).toHaveURL(/\/board/)
  })

  test('should persist project selection after navigation', async ({ page }) => {
    // Select Frontend Refactor project
    await sidebar.selectProject('Frontend Refactor')
    await page.waitForTimeout(500)

    // Navigate to Calendar
    await sidebar.navigateTo('Calendar')
    await expect(page).toHaveURL(/\/calendar/)

    // Navigate back to Board
    await sidebar.navigateTo('Board')
    await expect(page).toHaveURL(/\/board/)
    await page.waitForTimeout(500)

    // Verify Frontend Refactor still selected
    const frontendProject = page.locator('[data-project="Frontend Refactor"][aria-selected="true"]')
    await expect(frontendProject).toBeVisible()

    // Verify filtered tasks still visible
    const backlogColumn = await kanbanBoard.getColumn('backlog')
    await expect(backlogColumn.getByText('Refactor login component')).toBeVisible()
  })
})
