"use client"

import { useState, useEffect } from "react"
import { Bookmark, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { BoardFilters, FilterPreset } from "@/lib/types"
import {
  loadFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  MAX_PRESETS,
} from "@/lib/filter-presets"

interface FilterPresetManagerProps {
  currentFilters: BoardFilters
  onApplyPreset: (filters: BoardFilters) => void
}

export function FilterPresetManager({
  currentFilters,
  onApplyPreset,
}: FilterPresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadPresets()
    }
  }, [mounted])

  const loadPresets = () => {
    const loaded = loadFilterPresets()
    setPresets(loaded)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    saveFilterPreset(presetName, currentFilters)
    setPresetName("")
    setIsOpen(false)
    loadPresets()
  }

  const handleDeletePreset = (id: string) => {
    deleteFilterPreset(id)
    loadPresets()
  }

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters)
  }

  const formatPresetSummary = (filters: BoardFilters): string => {
    const parts: string[] = []

    if (filters.search) parts.push(`"${filters.search}"`)
    if (filters.priority !== "all") parts.push(`${filters.priority} priority`)
    if (filters.dateRange !== "all") {
      const rangeLabels: Record<string, string> = {
        today: "today",
        week: "this week",
        month: "this month",
        quarter: "this quarter",
        custom: "custom range",
      }
      parts.push(rangeLabels[filters.dateRange] || filters.dateRange)
    }
    if (filters.showArchived) parts.push("archived")

    return parts.length > 0 ? parts.join(", ") : "No filters"
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filter Presets</h3>
          {presets.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {presets.length} of {MAX_PRESETS}
            </Badge>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Preset</DialogTitle>
              <DialogDescription>
                Give your current filters a name to save them for quick access later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="Enter preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSavePreset()
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Filters</Label>
                <p className="text-sm text-muted-foreground">
                  {formatPresetSummary(currentFilters)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
          No saved presets yet.
          <br />
          Click "Save Current" to create one.
        </div>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-start gap-2 p-2 rounded-md border hover:bg-accent/50 transition-colors group"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => handleApplyPreset(preset)}
                  aria-label={preset.name}
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatPresetSummary(preset.filters)}
                  </div>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeletePreset(preset.id)}
                  aria-label="delete preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
