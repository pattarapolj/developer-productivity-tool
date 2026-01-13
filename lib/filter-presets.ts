import type { BoardFilters, FilterPreset } from "./types"

export const MAX_PRESETS = 20
const STORAGE_KEY = "filter-presets"

/**
 * Generate a unique ID for a preset
 */
const generateId = (): string => {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
}

/**
 * Serialize filters for storage (handles Date objects)
 */
const serializeFilters = (filters: BoardFilters): BoardFilters => {
  // Convert Date objects to ISO strings for storage
  return {
    ...filters,
    customStart: filters.customStart ? filters.customStart.toISOString() as any : null,
    customEnd: filters.customEnd ? filters.customEnd.toISOString() as any : null,
  }
}

/**
 * Deserialize filters from storage (reconstructs Date objects)
 */
const deserializeFilters = (filters: any): BoardFilters => {
  // Convert ISO strings back to Date objects
  return {
    ...filters,
    customStart: filters.customStart ? new Date(filters.customStart) : null,
    customEnd: filters.customEnd ? new Date(filters.customEnd) : null,
  }
}

/**
 * Load all filter presets from localStorage
 */
export const loadFilterPresets = (): FilterPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const presets: Array<{
      id: string
      name: string
      filters: any
      createdAt: string
    }> = JSON.parse(stored)

    return presets
      .map((p) => ({
        id: p.id,
        name: p.name,
        filters: deserializeFilters(p.filters),
        createdAt: new Date(p.createdAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // newest first
  } catch (error) {
    console.error("Failed to load filter presets:", error)
    return []
  }
}

/**
 * Save a new filter preset to localStorage
 */
export const saveFilterPreset = (name: string, filters: BoardFilters): FilterPreset => {
  const presets = loadFilterPresets()

  const newPreset: FilterPreset = {
    id: generateId(),
    name,
    filters,
    createdAt: new Date(),
  }

  // Add new preset and enforce MAX_PRESETS limit
  const updatedPresets = [newPreset, ...presets]
  if (updatedPresets.length > MAX_PRESETS) {
    // Remove oldest presets
    updatedPresets.splice(MAX_PRESETS)
  }

  // Serialize for storage
  const toStore = updatedPresets.map((p) => ({
    id: p.id,
    name: p.name,
    filters: serializeFilters(p.filters),
    createdAt: p.createdAt.toISOString(),
  }))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))

  return newPreset
}

/**
 * Delete a filter preset by id
 */
export const deleteFilterPreset = (id: string): void => {
  const presets = loadFilterPresets()
  const filtered = presets.filter((p) => p.id !== id)

  const toStore = filtered.map((p) => ({
    id: p.id,
    name: p.name,
    filters: serializeFilters(p.filters),
    createdAt: p.createdAt.toISOString(),
  }))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
}

/**
 * Get a specific filter preset by id
 */
export const getFilterPreset = (id: string): FilterPreset | undefined => {
  const presets = loadFilterPresets()
  return presets.find((p) => p.id === id)
}
