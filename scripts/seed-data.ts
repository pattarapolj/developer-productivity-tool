/**
 * Seed Data Script
 * 
 * This script provides sample data for testing and demonstration.
 * Run these functions from the browser console or import them where needed.
 * 
 * Usage in browser console:
 *   - To seed: copy and paste the seedSampleData() function content
 *   - To clear: localStorage.removeItem('ToolingTracker-storage'); location.reload();
 */

import type { Project, Task, TimeEntry, ProjectColor, Priority, TaskStatus } from "@/lib/types"

// Helper to create dates relative to today
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const hoursAgo = (hours: number) => {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date
}

// Helper to create task with all required fields
const createTask = (data: Omit<Task, 'completedAt' | 'blockedBy' | 'blocking'>): Task => ({
  ...data,
  completedAt: data.status === 'done' ? data.updatedAt : null,
  blockedBy: [],
  blocking: [],
})

// Sample Projects
export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-frontend",
    name: "Frontend Development",
    color: "blue" as ProjectColor,
    subcategories: ["UI Components", "Bug Fixes", "Performance", "Testing"],
    jiraKey: "FE",
    createdAt: daysAgo(60),
  },
  {
    id: "proj-backend",
    name: "Backend API",
    color: "green" as ProjectColor,
    subcategories: ["Endpoints", "Database", "Authentication", "Documentation"],
    jiraKey: "BE",
    createdAt: daysAgo(60),
  },
  {
    id: "proj-devops",
    name: "DevOps & Infrastructure",
    color: "orange" as ProjectColor,
    subcategories: ["CI/CD", "Monitoring", "Security", "Deployment"],
    jiraKey: "OPS",
    createdAt: daysAgo(45),
  },
  {
    id: "proj-mobile",
    name: "Mobile App",
    color: "purple" as ProjectColor,
    subcategories: ["iOS", "Android", "Cross-platform", "App Store"],
    jiraKey: "MOB",
    createdAt: daysAgo(30),
  },
  {
    id: "proj-learning",
    name: "Learning & Research",
    color: "pink" as ProjectColor,
    subcategories: ["Tutorials", "Documentation", "Experiments"],
    jiraKey: null,
    createdAt: daysAgo(90),
  },
]

// Sample Tasks
export const SAMPLE_TASKS: Omit<Task, 'completedAt' | 'blockedBy' | 'blocking'>[] = [
  // Backlog tasks
  createTask({
    id: "task-backlog-1",
    title: "Implement real-time collaboration",
    description: "Add WebSocket support for real-time task updates across multiple users.\n\n**Considerations:**\n- Socket.io vs native WebSockets\n- Conflict resolution\n- Offline support",
    status: "backlog" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-frontend",
    subcategory: "UI Components",
    dueDate: null,
    jiraKey: "FE-200",
    storyPoints: 13,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-backlog-2",
    title: "Add GraphQL API layer",
    description: "Consider migrating from REST to GraphQL for more efficient data fetching.",
    status: "backlog" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-backend",
    subcategory: "Endpoints",
    dueDate: null,
    jiraKey: "BE-300",
    storyPoints: 21,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-backlog-3",
    title: "Kubernetes migration",
    description: "Migrate from Docker Compose to Kubernetes for better scalability and orchestration.",
    status: "backlog" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-devops",
    subcategory: "Deployment",
    dueDate: null,
    jiraKey: "OPS-400",
    storyPoints: 34,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    isArchived: false,
    archivedAt: null,
  }),
  
  // Frontend tasks
  createTask({
    id: "task-1",
    title: "Implement dark mode toggle",
    description: "# Dark Mode Implementation\n\nAdd a toggle switch to enable/disable dark mode.\n\n## Requirements\n- [ ] Create toggle component\n- [ ] Persist preference in localStorage\n- [ ] Add smooth transition\n- [x] Design approved\n\n> This is a high priority feature requested by users.",
    status: "done" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-frontend",
    subcategory: "UI Components",
    dueDate: daysAgo(5),
    jiraKey: "FE-101",
    storyPoints: 3,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-2",
    title: "Fix responsive layout on mobile",
    description: "The sidebar overlaps content on screens smaller than 768px. Need to implement proper responsive breakpoints.",
    status: "in-progress" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-frontend",
    subcategory: "Bug Fixes",
    dueDate: daysAgo(-2), // 2 days from now
    jiraKey: "FE-102",
    storyPoints: 2,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-3",
    title: "Optimize bundle size",
    description: "Current bundle is 2.5MB. Target is under 500KB.\n\n**Analysis needed:**\n- Tree shaking\n- Code splitting\n- Lazy loading components",
    status: "todo" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-frontend",
    subcategory: "Performance",
    dueDate: daysAgo(-7),
    jiraKey: "FE-103",
    storyPoints: 5,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-4",
    title: "Write unit tests for auth module",
    description: "Add Jest tests for:\n- Login flow\n- Token refresh\n- Logout\n- Session management",
    status: "todo" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-frontend",
    subcategory: "Testing",
    dueDate: null,
    jiraKey: "FE-104",
    storyPoints: 3,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    isArchived: false,
    archivedAt: null,
  }),
  
  // Backend tasks
  createTask({
    id: "task-5",
    title: "Create user profile endpoint",
    description: "## API Endpoint\n\n`GET /api/users/:id/profile`\n\n### Response\n```json\n{\n  \"id\": \"string\",\n  \"name\": \"string\",\n  \"email\": \"string\",\n  \"avatar\": \"string\"\n}\n```",
    status: "done" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-backend",
    subcategory: "Endpoints",
    dueDate: daysAgo(10),
    jiraKey: "BE-201",
    storyPoints: 2,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(8),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-6",
    title: "Optimize database queries",
    description: "Several N+1 queries identified in the reports module. Need to add eager loading and indexing.",
    status: "in-progress" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-backend",
    subcategory: "Database",
    dueDate: daysAgo(-1),
    jiraKey: "BE-202",
    storyPoints: 5,
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(4),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-7",
    title: "Implement OAuth2 with Google",
    description: "Add Google sign-in option using OAuth2 flow.\n\n- [ ] Register app with Google\n- [ ] Implement callback handler\n- [ ] Link with existing accounts",
    status: "todo" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-backend",
    subcategory: "Authentication",
    dueDate: daysAgo(-14),
    jiraKey: "BE-203",
    storyPoints: 8,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-8",
    title: "Update API documentation",
    description: "Swagger docs are outdated. Need to update with new endpoints and examples.",
    status: "todo" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-backend",
    subcategory: "Documentation",
    dueDate: null,
    jiraKey: "BE-204",
    storyPoints: 2,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
    isArchived: false,
    archivedAt: null,
  }),
  
  // DevOps tasks
  createTask({
    id: "task-9",
    title: "Set up GitHub Actions CI/CD",
    description: "Create workflow for:\n- Running tests on PR\n- Building Docker image\n- Deploying to staging",
    status: "done" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-devops",
    subcategory: "CI/CD",
    dueDate: daysAgo(20),
    jiraKey: "OPS-301",
    storyPoints: 5,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(18),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-10",
    title: "Configure Prometheus monitoring",
    description: "Set up metrics collection and Grafana dashboards for production monitoring.",
    status: "in-progress" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-devops",
    subcategory: "Monitoring",
    dueDate: daysAgo(-3),
    jiraKey: "OPS-302",
    storyPoints: 3,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-11",
    title: "Security audit preparation",
    description: "Prepare documentation and access for upcoming security audit.\n\n**Checklist:**\n- [ ] Network diagrams\n- [ ] Access logs\n- [ ] Encryption details\n- [ ] Incident response plan",
    status: "todo" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-devops",
    subcategory: "Security",
    dueDate: daysAgo(-10),
    jiraKey: "OPS-303",
    storyPoints: 8,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    isArchived: false,
    archivedAt: null,
  }),
  
  // Mobile tasks
  createTask({
    id: "task-12",
    title: "Push notification setup",
    description: "Implement push notifications for iOS and Android using Firebase Cloud Messaging.",
    status: "in-progress" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-mobile",
    subcategory: "Cross-platform",
    dueDate: daysAgo(-5),
    jiraKey: "MOB-401",
    storyPoints: 5,
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(2),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-13",
    title: "App Store submission",
    description: "Prepare and submit v2.0 to App Store.\n\n- Screenshots\n- Release notes\n- Privacy policy update",
    status: "todo" as TaskStatus,
    priority: "medium" as Priority,
    projectId: "proj-mobile",
    subcategory: "App Store",
    dueDate: daysAgo(-14),
    jiraKey: "MOB-402",
    storyPoints: 3,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    isArchived: false,
    archivedAt: null,
  }),
  
  // Learning tasks
  createTask({
    id: "task-14",
    title: "Complete React 19 tutorial",
    description: "Go through the official React 19 docs and new features:\n- Server Components\n- Actions\n- New hooks",
    status: "done" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-learning",
    subcategory: "Tutorials",
    dueDate: null,
    jiraKey: null,
    storyPoints: null,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(14),
    isArchived: false,
    archivedAt: null,
  }),
  createTask({
    id: "task-15",
    title: "Research AI code assistants",
    description: "Evaluate different AI tools:\n- GitHub Copilot\n- Cursor\n- Codeium\n\nDocument pros/cons for team presentation.",
    status: "in-progress" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-learning",
    subcategory: "Experiments",
    dueDate: null,
    jiraKey: null,
    storyPoints: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    isArchived: false,
    archivedAt: null,
  }),
  
  // Some archived tasks for testing archive feature
  createTask({
    id: "task-archived-1",
    title: "Legacy code cleanup",
    description: "Removed deprecated utility functions from v1.",
    status: "done" as TaskStatus,
    priority: "low" as Priority,
    projectId: "proj-frontend",
    subcategory: "Bug Fixes",
    dueDate: daysAgo(45),
    jiraKey: "FE-050",
    storyPoints: 2,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(45),
    isArchived: true,
    archivedAt: daysAgo(40),
  }),
  createTask({
    id: "task-archived-2",
    title: "Initial project setup",
    description: "Set up Next.js project with TypeScript, Tailwind, and ESLint.",
    status: "done" as TaskStatus,
    priority: "high" as Priority,
    projectId: "proj-frontend",
    subcategory: "UI Components",
    dueDate: daysAgo(55),
    jiraKey: "FE-001",
    storyPoints: 3,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(55),
    isArchived: true,
    archivedAt: daysAgo(50),
  }),
]

// Sample Time Entries - spread across different days and tasks
export const SAMPLE_TIME_ENTRIES: Omit<TimeEntry, 'type'>[] = [
  // Today's entries
  { id: "time-1", taskId: "task-2", hours: 2, minutes: 30, date: daysAgo(0), notes: "Working on responsive breakpoints", createdAt: hoursAgo(3) },
  { id: "time-2", taskId: "task-6", hours: 1, minutes: 45, date: daysAgo(0), notes: "Analyzing slow queries with EXPLAIN", createdAt: hoursAgo(5) },
  { id: "time-3", taskId: "task-12", hours: 1, minutes: 0, date: daysAgo(0), notes: "FCM setup for Android", createdAt: hoursAgo(7) },
  
  // Yesterday
  { id: "time-4", taskId: "task-2", hours: 3, minutes: 0, date: daysAgo(1), notes: "Sidebar responsive redesign", createdAt: daysAgo(1) },
  { id: "time-5", taskId: "task-6", hours: 2, minutes: 15, date: daysAgo(1), notes: "Added database indexes", createdAt: daysAgo(1) },
  { id: "time-6", taskId: "task-10", hours: 1, minutes: 30, date: daysAgo(1), notes: "Prometheus configuration", createdAt: daysAgo(1) },
  { id: "time-7", taskId: "task-15", hours: 0, minutes: 45, date: daysAgo(1), notes: "Testing Copilot features", createdAt: daysAgo(1) },
  
  // 2 days ago
  { id: "time-8", taskId: "task-1", hours: 4, minutes: 0, date: daysAgo(2), notes: "Completed dark mode implementation", createdAt: daysAgo(2) },
  { id: "time-9", taskId: "task-6", hours: 2, minutes: 0, date: daysAgo(2), notes: "Query optimization research", createdAt: daysAgo(2) },
  { id: "time-10", taskId: "task-12", hours: 2, minutes: 30, date: daysAgo(2), notes: "Push notification architecture", createdAt: daysAgo(2) },
  
  // 3 days ago
  { id: "time-11", taskId: "task-1", hours: 3, minutes: 30, date: daysAgo(3), notes: "Dark mode toggle component", createdAt: daysAgo(3) },
  { id: "time-12", taskId: "task-5", hours: 2, minutes: 0, date: daysAgo(3), notes: "Profile endpoint testing", createdAt: daysAgo(3) },
  { id: "time-13", taskId: "task-10", hours: 1, minutes: 15, date: daysAgo(3), notes: "Grafana dashboard setup", createdAt: daysAgo(3) },
  
  // 4 days ago
  { id: "time-14", taskId: "task-1", hours: 2, minutes: 45, date: daysAgo(4), notes: "Dark mode color palette", createdAt: daysAgo(4) },
  { id: "time-15", taskId: "task-9", hours: 3, minutes: 0, date: daysAgo(4), notes: "GitHub Actions workflow", createdAt: daysAgo(4) },
  { id: "time-16", taskId: "task-14", hours: 1, minutes: 30, date: daysAgo(4), notes: "React 19 Server Components", createdAt: daysAgo(4) },
  
  // 5 days ago
  { id: "time-17", taskId: "task-5", hours: 4, minutes: 0, date: daysAgo(5), notes: "User profile API development", createdAt: daysAgo(5) },
  { id: "time-18", taskId: "task-9", hours: 2, minutes: 30, date: daysAgo(5), notes: "Docker build optimization", createdAt: daysAgo(5) },
  
  // Week ago entries
  { id: "time-19", taskId: "task-5", hours: 3, minutes: 0, date: daysAgo(7), notes: "API endpoint design", createdAt: daysAgo(7) },
  { id: "time-20", taskId: "task-2", hours: 1, minutes: 30, date: daysAgo(7), notes: "Bug investigation", createdAt: daysAgo(7) },
  { id: "time-21", taskId: "task-14", hours: 2, minutes: 0, date: daysAgo(7), notes: "React 19 Actions tutorial", createdAt: daysAgo(7) },
  
  // 2 weeks ago
  { id: "time-22", taskId: "task-1", hours: 2, minutes: 0, date: daysAgo(14), notes: "Initial dark mode research", createdAt: daysAgo(14) },
  { id: "time-23", taskId: "task-9", hours: 4, minutes: 30, date: daysAgo(14), notes: "CI/CD pipeline setup", createdAt: daysAgo(14) },
  { id: "time-24", taskId: "task-14", hours: 3, minutes: 0, date: daysAgo(14), notes: "React 19 new hooks study", createdAt: daysAgo(14) },
  
  // 3 weeks ago
  { id: "time-25", taskId: "task-5", hours: 3, minutes: 30, date: daysAgo(21), notes: "Profile endpoint planning", createdAt: daysAgo(21) },
  { id: "time-26", taskId: "task-9", hours: 2, minutes: 0, date: daysAgo(21), notes: "GitHub Actions research", createdAt: daysAgo(21) },
  
  // Month ago
  { id: "time-27", taskId: "task-9", hours: 1, minutes: 30, date: daysAgo(30), notes: "Initial CI/CD planning", createdAt: daysAgo(30) },
  { id: "time-28", taskId: "task-archived-2", hours: 5, minutes: 0, date: daysAgo(55), notes: "Project initialization", createdAt: daysAgo(55) },
  { id: "time-29", taskId: "task-archived-1", hours: 2, minutes: 30, date: daysAgo(45), notes: "Code cleanup complete", createdAt: daysAgo(45) },
]

/**
 * Get the complete seed data object ready to be stored
 */
export function getSeedData() {
  return {
    state: {
      projects: SAMPLE_PROJECTS,
      tasks: SAMPLE_TASKS,
      timeEntries: SAMPLE_TIME_ENTRIES,
      selectedProjectId: null,
      boardFilters: {
        search: "",
        projectId: null,
        priority: "all",
        dateRange: "all",
        showArchived: false,
      },
    },
    version: 1,
  }
}

/**
 * Instructions for using in browser console:
 * 
 * TO SEED DATA:
 * localStorage.setItem('ToolingTracker-storage', JSON.stringify(SEED_DATA));
 * location.reload();
 * 
 * TO CLEAR DATA:
 * localStorage.removeItem('ToolingTracker-storage');
 * location.reload();
 */
