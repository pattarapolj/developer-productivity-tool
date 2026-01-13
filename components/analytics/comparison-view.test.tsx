import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ComparisonView } from "./comparison-view"
import type { ComparisonData } from "@/lib/types"

describe("ComparisonView Component", () => {
  const sampleData: ComparisonData = {
    current: {
      tasksCompleted: 10,
      tasksCreated: 15,
      totalTime: 300, // 5 hours
      avgCompletionTime: 3, // 3 days
    },
    previous: {
      tasksCompleted: 8,
      tasksCreated: 12,
      totalTime: 240, // 4 hours
      avgCompletionTime: 5, // 5 days
    },
    delta: {
      tasksCompleted: 2,
      tasksCompletedPercent: 25,
      tasksCreated: 3,
      tasksCreatedPercent: 25,
      totalTime: 60,
      totalTimePercent: 25,
      avgCompletionTime: -2,
      avgCompletionTimePercent: -40,
    },
  }

  it("should render the component with correct title", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText("Period Comparison")).toBeInTheDocument()
  })

  it("should display correct period labels for week-over-week", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText(/This Week/i)).toBeInTheDocument()
    expect(screen.getByText(/Last Week/i)).toBeInTheDocument()
  })

  it("should display correct period labels for month-over-month", () => {
    render(<ComparisonView data={sampleData} period="month-over-month" />)
    expect(screen.getByText(/This Month/i)).toBeInTheDocument()
    expect(screen.getByText(/Last Month/i)).toBeInTheDocument()
  })

  it("should display correct period labels for quarter-over-quarter", () => {
    render(<ComparisonView data={sampleData} period="quarter-over-quarter" />)
    expect(screen.getByText(/This Quarter/i)).toBeInTheDocument()
    expect(screen.getByText(/Last Quarter/i)).toBeInTheDocument()
  })

  it("should display tasks completed metric", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText("Tasks Completed")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText(/vs 8/)).toBeInTheDocument()
    expect(screen.getByText(/\+2.*\+25%/)).toBeInTheDocument()
  })

  it("should display tasks created metric", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText("Tasks Created")).toBeInTheDocument()
    expect(screen.getByText("15")).toBeInTheDocument()
    expect(screen.getByText(/vs 12/)).toBeInTheDocument()
    expect(screen.getByText(/\+3.*\+25%/)).toBeInTheDocument()
  })

  it("should display time logged metric with formatted hours", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText("Time Logged")).toBeInTheDocument()
    expect(screen.getByText("5h")).toBeInTheDocument()
    expect(screen.getByText(/vs 4h/)).toBeInTheDocument()
    expect(screen.getByText(/\+60.*\+25%/)).toBeInTheDocument()
  })

  it("should display average completion time metric with inverted colors", () => {
    render(<ComparisonView data={sampleData} period="week-over-week" />)
    expect(screen.getByText("Avg Completion Time")).toBeInTheDocument()
    expect(screen.getByText("3d")).toBeInTheDocument()
    expect(screen.getByText(/vs 5d/)).toBeInTheDocument()
    // -2 days is good (inverted colors), should show green
    expect(screen.getByText(/-2.*-40%/)).toBeInTheDocument()
  })

  it("should handle zero values gracefully", () => {
    const zeroData: ComparisonData = {
      current: {
        tasksCompleted: 0,
        tasksCreated: 0,
        totalTime: 0,
        avgCompletionTime: 0,
      },
      previous: {
        tasksCompleted: 0,
        tasksCreated: 0,
        totalTime: 0,
        avgCompletionTime: 0,
      },
      delta: {
        tasksCompleted: 0,
        tasksCompletedPercent: 0,
        tasksCreated: 0,
        tasksCreatedPercent: 0,
        totalTime: 0,
        totalTimePercent: 0,
        avgCompletionTime: 0,
        avgCompletionTimePercent: 0,
      },
    }
    render(<ComparisonView data={zeroData} period="week-over-week" />)
    
    // Check that metrics are displayed with zero values
    expect(screen.getByText("Tasks Completed")).toBeInTheDocument()
    expect(screen.getByText("Tasks Created")).toBeInTheDocument()
    expect(screen.getByText("Time Logged")).toBeInTheDocument()
    expect(screen.getByText("Avg Completion Time")).toBeInTheDocument()
    
    // Check that deltas show 0 (0%)
    expect(screen.getAllByText(/0.*0%/)).toHaveLength(4)
    
    // Check that N/A is shown for avg completion time when zero
    expect(screen.getByText("N/A")).toBeInTheDocument()
    expect(screen.getByText(/vs N\/A/)).toBeInTheDocument()
  })

  it("should format time with hours and minutes", () => {
    const timeData: ComparisonData = {
      ...sampleData,
      current: { ...sampleData.current, totalTime: 195 }, // 3h 15m
      previous: { ...sampleData.previous, totalTime: 125 }, // 2h 5m
      delta: { ...sampleData.delta, totalTime: 70, totalTimePercent: 56 },
    }
    render(<ComparisonView data={timeData} period="week-over-week" />)
    expect(screen.getByText("3h 15m")).toBeInTheDocument()
    expect(screen.getByText(/vs 2h 5m/)).toBeInTheDocument()
  })

  it("should show negative delta for decreased values", () => {
    const decreaseData: ComparisonData = {
      ...sampleData,
      current: { ...sampleData.current, tasksCompleted: 5 },
      previous: { ...sampleData.previous, tasksCompleted: 10 },
      delta: { ...sampleData.delta, tasksCompleted: -5, tasksCompletedPercent: -50 },
    }
    render(<ComparisonView data={decreaseData} period="week-over-week" />)
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText(/vs 10/)).toBeInTheDocument()
    expect(screen.getByText(/-5.*-50%/)).toBeInTheDocument()
  })
})
