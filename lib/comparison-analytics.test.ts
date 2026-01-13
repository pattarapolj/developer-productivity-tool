import { describe, it, expect, beforeEach } from "vitest"
import { useToolingTrackerStore } from "./store"
import type { Task, TimeEntry } from "./types"

describe("Comparison Analytics", () => {
  let projectId: string

  beforeEach(() => {
    const store = useToolingTrackerStore.getState()
    store.tasks = []
    store.timeEntries = []
    store.activities = []
    store.projects = []
    
    // Add a test project
    store.addProject("Test Project", "blue")
    projectId = useToolingTrackerStore.getState().projects[0].id
  })

  describe("getComparisonData - Week-over-Week", () => {
    it("should calculate week-over-week comparison for completed tasks", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z") // Tuesday

      // Current week (Sun Jan 11 - Sat Jan 17): 3 completed tasks
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-12T08:00:00Z"),
        completedAt: new Date("2026-01-13T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-13T08:00:00Z"),
        completedAt: new Date("2026-01-14T10:00:00Z"),
      })
      store.addTask({
        title: "Task 3",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-14T08:00:00Z"),
        completedAt: new Date("2026-01-15T10:00:00Z"),
      })

      // Previous week (Sun Jan 4 - Sat Jan 10): 2 completed tasks
      store.addTask({
        title: "Task 4",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-05T08:00:00Z"),
        completedAt: new Date("2026-01-06T10:00:00Z"),
      })
      store.addTask({
        title: "Task 5",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-09T08:00:00Z"),
        completedAt: new Date("2026-01-10T10:00:00Z"),
      })

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.tasksCompleted).toBe(3)
      expect(comparison.previous.tasksCompleted).toBe(2)
      expect(comparison.delta.tasksCompleted).toBe(1)
      expect(comparison.delta.tasksCompletedPercent).toBe(50) // 50% increase
    })

    it("should calculate week-over-week comparison for created tasks", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      // Current week: 4 created
      store.addTask({
        title: "Task 1",
        description: "",
        status: "todo",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-12T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "in-progress",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-13T10:00:00Z"),
      })
      store.addTask({
        title: "Task 3",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-14T10:00:00Z"),
      })
      store.addTask({
        title: "Task 4",
        description: "",
        status: "backlog",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-15T10:00:00Z"),
      })

      // Previous week: 5 created
      for (let i = 5; i <= 9; i++) {
        store.addTask({
          title: `Task ${i}`,
          description: "",
          status: "todo",
          priority: "medium",
          projectId,
          createdAt: new Date(`2026-01-0${i}T10:00:00Z`),
        })
      }

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.tasksCreated).toBe(4)
      expect(comparison.previous.tasksCreated).toBe(5)
      expect(comparison.delta.tasksCreated).toBe(-1)
      expect(comparison.delta.tasksCreatedPercent).toBe(-20) // 20% decrease
    })

    it("should handle zero previous period (no division by zero)", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      // Current week: 2 completed
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        completedAt: new Date("2026-01-13T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        completedAt: new Date("2026-01-14T10:00:00Z"),
      })

      // Previous week: 0 completed (no tasks)

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.tasksCompleted).toBe(2)
      expect(comparison.previous.tasksCompleted).toBe(0)
      expect(comparison.delta.tasksCompleted).toBe(2)
      expect(comparison.delta.tasksCompletedPercent).toBe(0) // No percentage when previous is 0
    })
  })

  describe("getComparisonData - Month-over-Month", () => {
    it("should calculate month-over-month comparison", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-15T12:00:00Z") // Mid-January

      // Current month (January 2026): 3 completed
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-04T08:00:00Z"),
        completedAt: new Date("2026-01-05T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-09T08:00:00Z"),
        completedAt: new Date("2026-01-10T10:00:00Z"),
      })
      store.addTask({
        title: "Task 3",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-14T08:00:00Z"),
        completedAt: new Date("2026-01-15T10:00:00Z"),
      })

      // Previous month (December 2025): 4 completed
      store.addTask({
        title: "Task 4",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-12-09T08:00:00Z"),
        completedAt: new Date("2025-12-10T10:00:00Z"),
      })
      store.addTask({
        title: "Task 5",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        completedAt: new Date("2025-12-15T10:00:00Z"),
      })
      store.addTask({
        title: "Task 6",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-12-19T08:00:00Z"),
        completedAt: new Date("2025-12-20T10:00:00Z"),
      })
      store.addTask({
        title: "Task 7",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-12-24T08:00:00Z"),
        completedAt: new Date("2025-12-25T10:00:00Z"),
      })

      const comparison = store.getComparisonData("month-over-month", now)

      expect(comparison.current.tasksCompleted).toBe(3)
      expect(comparison.previous.tasksCompleted).toBe(4)
      expect(comparison.delta.tasksCompleted).toBe(-1)
      expect(comparison.delta.tasksCompletedPercent).toBe(-25) // 25% decrease
    })
  })

  describe("getComparisonData - Quarter-over-Quarter", () => {
    it("should calculate quarter-over-quarter comparison", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-15T12:00:00Z") // Q1 2026

      // Current quarter (Q1 2026: Jan-Mar): 2 completed
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-09T08:00:00Z"),
        completedAt: new Date("2026-01-10T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-02-09T08:00:00Z"),
        completedAt: new Date("2026-02-10T10:00:00Z"),
      })

      // Previous quarter (Q4 2025: Oct-Dec): 3 completed
      store.addTask({
        title: "Task 3",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-10-14T08:00:00Z"),
        completedAt: new Date("2025-10-15T10:00:00Z"),
      })
      store.addTask({
        title: "Task 4",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-11-14T08:00:00Z"),
        completedAt: new Date("2025-11-15T10:00:00Z"),
      })
      store.addTask({
        title: "Task 5",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2025-12-14T08:00:00Z"),
        completedAt: new Date("2025-12-15T10:00:00Z"),
      })

      const comparison = store.getComparisonData("quarter-over-quarter", now)

      expect(comparison.current.tasksCompleted).toBe(2)
      expect(comparison.previous.tasksCompleted).toBe(3)
      expect(comparison.delta.tasksCompleted).toBe(-1)
      expect(Math.round(comparison.delta.tasksCompletedPercent)).toBe(-33) // ~33% decrease
    })
  })

  describe("getComparisonData - Time Tracking", () => {
    it("should calculate total time comparison", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      // Create tasks for current and previous weeks
      const task1 = store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-13T09:00:00Z"),
      })
      const task2 = store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-06T09:00:00Z"),
      })

      // Current week: 5 hours total
      store.addTimeEntry({
        taskId: task1!.id,
        hours: 3,
        minutes: 0,
        type: "development",
        date: new Date("2026-01-13T10:00:00Z"),
        description: "",
      })
      store.addTimeEntry({
        taskId: task1!.id,
        hours: 2,
        minutes: 0,
        type: "development",
        date: new Date("2026-01-14T10:00:00Z"),
        description: "",
      })

      // Previous week: 4 hours total
      store.addTimeEntry({
        taskId: task2!.id,
        hours: 4,
        minutes: 0,
        type: "development",
        date: new Date("2026-01-06T10:00:00Z"),
        description: "",
      })

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.totalTime).toBe(300) // 5 hours in minutes
      expect(comparison.previous.totalTime).toBe(240) // 4 hours in minutes
      expect(comparison.delta.totalTime).toBe(60) // 1 hour increase
      expect(comparison.delta.totalTimePercent).toBe(25) // 25% increase
    })

    it("should calculate average completion time comparison", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      // Current week: 2 tasks, avg 3 days
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-10T10:00:00Z"), // 3 days ago
        completedAt: new Date("2026-01-13T10:00:00Z"),
      })
      store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-11T10:00:00Z"), // 3 days ago
        completedAt: new Date("2026-01-14T10:00:00Z"),
      })

      // Previous week: 2 tasks, avg 5 days
      store.addTask({
        title: "Task 3",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-01T10:00:00Z"), // 5 days
        completedAt: new Date("2026-01-06T10:00:00Z"),
      })
      store.addTask({
        title: "Task 4",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        createdAt: new Date("2026-01-02T10:00:00Z"), // 5 days
        completedAt: new Date("2026-01-07T10:00:00Z"),
      })

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.avgCompletionTime).toBe(3)
      expect(comparison.previous.avgCompletionTime).toBe(5)
      expect(comparison.delta.avgCompletionTime).toBe(-2) // 2 days faster
      expect(comparison.delta.avgCompletionTimePercent).toBe(-40) // 40% improvement
    })
  })

  describe("getComparisonData - Edge Cases", () => {
    it("should handle empty current and previous periods", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.tasksCompleted).toBe(0)
      expect(comparison.previous.tasksCompleted).toBe(0)
      expect(comparison.delta.tasksCompleted).toBe(0)
      expect(comparison.delta.tasksCompletedPercent).toBe(0)
    })

    it("should exclude archived tasks from comparison", () => {
      const store = useToolingTrackerStore.getState()
      const now = new Date("2026-01-13T12:00:00Z")

      // Current week: 2 tasks (1 archived)
      store.addTask({
        title: "Task 1",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        completedAt: new Date("2026-01-13T10:00:00Z"),
      })
      const task2 = store.addTask({
        title: "Task 2",
        description: "",
        status: "done",
        priority: "medium",
        projectId,
        completedAt: new Date("2026-01-14T10:00:00Z"),
      })
      store.archiveTask(task2!.id)

      const comparison = store.getComparisonData("week-over-week", now)

      expect(comparison.current.tasksCompleted).toBe(1) // Only non-archived
    })
  })
})
