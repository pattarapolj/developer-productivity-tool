import { describe, it, expect, beforeEach, vi } from "vitest"
import type { BoardFilters, FilterPreset } from "./types"
import {
  saveFilterPreset,
  loadFilterPresets,
  deleteFilterPreset,
  getFilterPreset,
  MAX_PRESETS,
} from "./filter-presets"

describe("Filter Presets", () => {
  const mockFilters: BoardFilters = {
    search: "test",
    projectId: "proj-1",
    priority: "high",
    dateRange: "week",
    customStart: null,
    customEnd: null,
    showArchived: false,
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe("saveFilterPreset", () => {
    it("should save a new preset to localStorage", () => {
      const preset = saveFilterPreset("My Preset", mockFilters)

      expect(preset.id).toBeDefined()
      expect(preset.name).toBe("My Preset")
      expect(preset.filters).toEqual(mockFilters)
      expect(preset.createdAt).toBeInstanceOf(Date)

      const saved = loadFilterPresets()
      expect(saved).toHaveLength(1)
      expect(saved[0].name).toBe("My Preset")
    })

    it("should enforce MAX_PRESETS limit (20)", () => {
      // Create 20 presets
      for (let i = 0; i < MAX_PRESETS; i++) {
        saveFilterPreset(`Preset ${i}`, mockFilters)
      }

      const presets = loadFilterPresets()
      expect(presets).toHaveLength(MAX_PRESETS)

      // Try to add one more - should remove oldest
      const newPreset = saveFilterPreset("New Preset", mockFilters)
      const updated = loadFilterPresets()

      expect(updated).toHaveLength(MAX_PRESETS)
      expect(updated[0].id).toBe(newPreset.id) // newest is first
      expect(updated.find((p) => p.name === "Preset 0")).toBeUndefined() // oldest removed
    })

    it("should serialize dates correctly", () => {
      const customStart = new Date("2026-01-01")
      const customEnd = new Date("2026-01-31")
      const filtersWithDates: BoardFilters = {
        ...mockFilters,
        dateRange: "custom",
        customStart,
        customEnd,
      }

      saveFilterPreset("Date Preset", filtersWithDates)
      const loaded = loadFilterPresets()

      // Dates should be reconstructed as Date objects
      const loadedStart = loaded[0].filters.customStart
      const loadedEnd = loaded[0].filters.customEnd

      expect(loadedStart).toBeInstanceOf(Date)
      expect(loadedEnd).toBeInstanceOf(Date)
      expect(loadedStart?.getTime()).toBe(customStart.getTime())
      expect(loadedEnd?.getTime()).toBe(customEnd.getTime())
    })
  })

  describe("loadFilterPresets", () => {
    it("should return empty array when no presets exist", () => {
      const presets = loadFilterPresets()
      expect(presets).toEqual([])
    })

    it("should return all saved presets sorted by createdAt (newest first)", () => {
      const preset1 = saveFilterPreset("First", mockFilters)
      // Delay to ensure different timestamps
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)
      const preset2 = saveFilterPreset("Second", mockFilters)
      vi.useRealTimers()

      const loaded = loadFilterPresets()
      expect(loaded).toHaveLength(2)
      expect(loaded[0].id).toBe(preset2.id) // newest first
      expect(loaded[1].id).toBe(preset1.id)
    })

    it("should handle corrupted localStorage data gracefully", () => {
      localStorage.setItem("filter-presets", "invalid-json")
      const presets = loadFilterPresets()
      expect(presets).toEqual([])
    })
  })

  describe("deleteFilterPreset", () => {
    it("should remove preset by id", () => {
      const preset1 = saveFilterPreset("First", mockFilters)
      const preset2 = saveFilterPreset("Second", mockFilters)

      deleteFilterPreset(preset1.id)

      const remaining = loadFilterPresets()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(preset2.id)
    })

    it("should do nothing if preset id does not exist", () => {
      saveFilterPreset("First", mockFilters)
      deleteFilterPreset("non-existent-id")

      const presets = loadFilterPresets()
      expect(presets).toHaveLength(1)
    })
  })

  describe("getFilterPreset", () => {
    it("should return preset by id", () => {
      const saved = saveFilterPreset("My Preset", mockFilters)
      const retrieved = getFilterPreset(saved.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(saved.id)
      expect(retrieved?.name).toBe("My Preset")
    })

    it("should return undefined if preset not found", () => {
      const preset = getFilterPreset("non-existent-id")
      expect(preset).toBeUndefined()
    })
  })
})
