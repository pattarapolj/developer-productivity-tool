import { test, expect, type Page } from '@playwright/test'

/**
 * Test fixtures and utilities for E2E tests
 */

/**
 * Clear localStorage before tests
 * Must be called after navigating to the app
 */
export async function clearStorage(page: Page) {
  // Navigate to the board page first to establish origin context
  await page.goto('http://localhost:3000/board')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    localStorage.clear()
  })
}

/**
 * Helper to seed sample data via localStorage
 */
export async function seedSampleData(page: Page) {
  await page.evaluate(() => {
    const now = new Date()
    
    const projects = [
      {
        id: 'proj1',
        name: 'Frontend Refactor',
        color: 'blue',
        subcategories: ['UI', 'Components', 'Performance'],
        jiraKey: 'FE',
        createdAt: now.toISOString(),
      },
      {
        id: 'proj2',
        name: 'API Integration',
        color: 'green',
        subcategories: ['REST', 'GraphQL'],
        jiraKey: 'API',
        createdAt: now.toISOString(),
      },
    ]

    const tasks = [
      {
        id: 'task1',
        title: 'Refactor login component',
        description: 'Update login component to use new auth flow',
        status: 'backlog',
        priority: 'high',
        projectId: 'proj1',
        subcategory: 'Components',
        jiraKey: 'FE-101',
        storyPoints: 5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        archived: false,
        createdAt: now.toISOString(),
        completedAt: null,
        blockedBy: [],
        blocking: [],
      },
      {
        id: 'task2',
        title: 'Implement GraphQL client',
        description: 'Set up Apollo client for GraphQL queries',
        status: 'todo',
        priority: 'medium',
        projectId: 'proj2',
        subcategory: 'GraphQL',
        jiraKey: 'API-201',
        storyPoints: 8,
        dueDate: null,
        archived: false,
        createdAt: now.toISOString(),
        completedAt: null,
        blockedBy: [],
        blocking: [],
      },
      {
        id: 'task3',
        title: 'Optimize bundle size',
        description: 'Reduce bundle size by code splitting',
        status: 'in-progress',
        priority: 'low',
        projectId: 'proj1',
        subcategory: 'Performance',
        jiraKey: 'FE-102',
        storyPoints: 3,
        dueDate: null,
        archived: false,
        createdAt: now.toISOString(),
        completedAt: null,
        blockedBy: [],
        blocking: [],
      },
    ]

    const timeEntries = [
      {
        id: 'time1',
        taskId: 'task3',
        hours: 2,
        minutes: 30,
        type: 'development',
        date: now.toISOString(),
        notes: 'Analyzed bundle and identified optimization opportunities',
      },
    ]

    const activities = []

    const state = {
      projects,
      tasks,
      timeEntries,
      activities,
      selectedProjectId: null,
      boardFilters: {
        search: '',
        projectId: null,
        priority: null,
        dateRange: null,
        showArchived: false,
      },
    }

    localStorage.setItem('ToolingTracker-storage', JSON.stringify({ state, version: 1 }))
  })
  
  // Reload page to hydrate Zustand state from localStorage
  await page.reload()
  await page.waitForLoadState('networkidle')
  
  // Wait for tasks to appear (Zustand hydration can take a moment)
  await page.waitForTimeout(1000)
}

/**
 * Helper to wait for data to load
 */
export async function waitForDataLoad(page: Page) {
  // Wait for main content to be visible
  await page.waitForSelector('[data-testid="kanban-board"], [data-testid="project-list"]', {
    timeout: 5000,
  })
}

/**
 * Page object for Kanban Board
 */
export class KanbanBoardPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/board')
    await waitForDataLoad(this.page)
  }

  async getColumn(status: 'backlog' | 'todo' | 'in-progress' | 'done') {
    const columnMap = {
      'backlog': 'Backlog',
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'done': 'Done',
    }
    // Find column by heading text, then get the parent flex container
    const heading = this.page.locator(`h3:text-is("${columnMap[status]}")`).first()
    // Navigate up to the column container (should be the grandparent div)
    return heading.locator('../..')
  }

  async getTaskCard(title: string) {
    // Task cards have role="button" and contain the task title in an h4
    return this.page.locator(`[role="button"]:has(h4:text-is("${title}"))`).first()
  }

  async dragTaskToColumn(taskTitle: string, targetStatus: 'backlog' | 'todo' | 'in-progress' | 'done') {
    const taskCard = await this.getTaskCard(taskTitle)
    const targetColumn = await this.getColumn(targetStatus)
    
    await taskCard.dragTo(targetColumn)
  }

  async openAddTaskDialog(columnStatus: 'backlog' | 'todo' | 'in-progress' | 'done') {
    const column = await this.getColumn(columnStatus)
    // The Plus button is in the column header
    await column.locator('button[class*="h-6 w-6"]').first().click()
    await this.page.waitForTimeout(300)
  }

  async getTaskCount(columnStatus: 'backlog' | 'todo' | 'in-progress' | 'done') {
    const column = await this.getColumn(columnStatus)
    // Count is in a span badge next to the h3
    const countBadge = column.locator('span.text-xs.text-muted-foreground').first()
    const countText = await countBadge.textContent()
    return countText ? parseInt(countText.trim()) : 0
  }
}

/**
 * Page object for Task Dialog
 */
export class TaskDialogPage {
  constructor(public page: Page) {}

  async fillTitle(title: string) {
    await this.page.getByPlaceholder('Task title').fill(title)
  }

  async fillDescription(description: string) {
    await this.page.getByPlaceholder(/description/i).fill(description)
  }

  async selectProject(projectName: string) {
    await this.page.getByRole('combobox', { name: /project/i }).click()
    await this.page.getByText(projectName, { exact: true }).click()
  }

  async selectPriority(priority: 'Low' | 'Medium' | 'High') {
    await this.page.getByRole('combobox', { name: /priority/i }).click()
    await this.page.getByText(priority, { exact: true }).click()
  }

  async fillStoryPoints(points: number) {
    await this.page.getByPlaceholder(/story points/i).fill(points.toString())
  }

  async submit() {
    await this.page.getByRole('button', { name: /(create|update) task/i }).click()
  }

  async cancel() {
    await this.page.getByRole('button', { name: /cancel/i }).click()
  }
}

/**
 * Page object for Time Entry Dialog
 */
export class TimeEntryDialogPage {
  constructor(public page: Page) {}

  async open(taskTitle: string) {
    // Find task card and hover to show dropdown button
    const taskCard = this.page.locator(`[role="button"][aria-label*="${taskTitle}"]`).first()
    await taskCard.hover()
    await this.page.waitForTimeout(200)
    
    // Click the MoreHorizontal button (dropdown trigger)
    const dropdownButton = taskCard.locator('button').first()
    await dropdownButton.click()
    await this.page.waitForTimeout(200)
    
    // Click Log Time menu item
    await this.page.getByRole('menuitem').filter({ hasText: /log time/i }).click()
  }

  async fillHours(hours: number) {
    await this.page.getByPlaceholder(/hours/i).fill(hours.toString())
  }

  async fillMinutes(minutes: number) {
    await this.page.getByPlaceholder(/minutes/i).fill(minutes.toString())
  }

  async selectType(type: 'Development' | 'Meeting' | 'Review' | 'Research' | 'Debugging' | 'Other') {
    await this.page.getByRole('combobox', { name: /type/i }).click()
    await this.page.getByText(type, { exact: true }).click()
  }

  async fillNotes(notes: string) {
    await this.page.getByPlaceholder(/notes/i).fill(notes)
  }

  async submit() {
    await this.page.getByRole('button', { name: /log time/i }).click()
  }
}

/**
 * Page object for Sidebar
 */
export class SidebarPage {
  constructor(public page: Page) {}

  async selectProject(projectName: string) {
    await this.page.getByRole('button', { name: projectName }).click()
  }

  async selectAllProjects() {
    await this.page.getByRole('button', { name: 'All Projects' }).click()
  }

  async openAddProjectDialog() {
    await this.page.getByRole('button', { name: /add project/i }).click()
  }

  async navigateTo(route: 'Overview' | 'Board' | 'Projects' | 'Calendar' | 'Analytics') {
    await this.page.getByRole('link', { name: route }).click()
  }
}
