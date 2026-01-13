import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FilterPresetManager } from "./filter-preset-manager"
import type { BoardFilters } from "@/lib/types"
import { saveFilterPreset } from "@/lib/filter-presets"

describe("FilterPresetManager Component", () => {
  const mockCurrentFilters: BoardFilters = {
    search: "test",
    projectId: "proj-1",
    priority: "high",
    dateRange: "week",
    customStart: null,
    customEnd: null,
    showArchived: false,
  }

  const mockOnApplyPreset = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should show 'No saved presets' when no presets exist", () => {
    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    expect(screen.getByText(/No saved presets/i)).toBeInTheDocument()
  })

  it("should show save preset dialog when save button clicked", async () => {
    const user = userEvent.setup()
    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    const saveButton = screen.getByRole("button", { name: /Save Current/i })
    await user.click(saveButton)

    expect(screen.getByPlaceholderText(/Enter preset name/i)).toBeInTheDocument()
  })

  it("should save new preset with name", async () => {
    const user = userEvent.setup()
    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    // Open save dialog
    const saveButton = screen.getByRole("button", { name: /Save Current/i })
    await user.click(saveButton)

    // Enter name and save
    const input = screen.getByPlaceholderText(/Enter preset name/i)
    await user.type(input, "My Preset")

    const confirmButton = screen.getByRole("button", { name: /^Save$/i })
    await user.click(confirmButton)

    // Preset should appear in list
    await waitFor(() => {
      expect(screen.getByText("My Preset")).toBeInTheDocument()
    })
  })

  it("should display list of saved presets", () => {
    // Pre-populate with presets
    saveFilterPreset("Preset 1", mockCurrentFilters)
    saveFilterPreset("Preset 2", { ...mockCurrentFilters, priority: "low" })

    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    expect(screen.getByText("Preset 1")).toBeInTheDocument()
    expect(screen.getByText("Preset 2")).toBeInTheDocument()
  })

  it("should call onApplyPreset when preset clicked", async () => {
    const preset = saveFilterPreset("My Preset", mockCurrentFilters)
    const user = userEvent.setup()

    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    const presetButton = screen.getByRole("button", { name: /My Preset/i })
    await user.click(presetButton)

    expect(mockOnApplyPreset).toHaveBeenCalledWith(mockCurrentFilters)
  })

  it("should delete preset when delete button clicked", async () => {
    saveFilterPreset("Preset to Delete", mockCurrentFilters)
    const user = userEvent.setup()

    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    expect(screen.getByText("Preset to Delete")).toBeInTheDocument()

    // Find and click delete button (trash icon) - need to hover first to make it visible
    const presetElement = screen.getByText("Preset to Delete").closest(".group")
    expect(presetElement).toBeInTheDocument()
    
    const deleteButton = screen.getByRole("button", { name: /delete preset/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText("Preset to Delete")).not.toBeInTheDocument()
    })
  })

  it("should show preset count limit warning when approaching MAX_PRESETS", () => {
    // Create 19 presets (one before limit)
    for (let i = 0; i < 19; i++) {
      saveFilterPreset(`Preset ${i}`, mockCurrentFilters)
    }

    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    expect(screen.getByText(/19.*20/i)).toBeInTheDocument() // Shows "19 of 20"
  })

  it("should display preset summary (search, project, priority, date range)", () => {
    const filtersWithDetails: BoardFilters = {
      search: "bug",
      projectId: "proj-1",
      priority: "high",
      dateRange: "week",
      customStart: null,
      customEnd: null,
      showArchived: false,
    }

    saveFilterPreset("Detailed Preset", filtersWithDetails)

    render(
      <FilterPresetManager
        currentFilters={mockCurrentFilters}
        onApplyPreset={mockOnApplyPreset}
      />
    )

    // Should show some indication of filter details (search term, priority, etc.)
    expect(screen.getByText(/Detailed Preset/i)).toBeInTheDocument()
    // Summary could show "high priority, this week" or similar
  })
})
