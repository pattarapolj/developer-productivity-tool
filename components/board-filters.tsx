"use client"

import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRangePicker } from "@/components/date-range-picker"
import { FilterPresetManager } from "@/components/filter-preset-manager"
import {
  Search,
  Filter,
  X,
  Archive,
  RotateCcw,
  Calendar,
  Flag,
  FolderKanban,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Priority } from "@/lib/types"

interface BoardFiltersProps {
  selectedCount: number
  onBulkArchive: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
  selectionMode: boolean
  onToggleSelectionMode: () => void
}

export function BoardFilters({
  selectedCount,
  onBulkArchive,
  onBulkDelete,
  onClearSelection,
  selectionMode,
  onToggleSelectionMode,
}: BoardFiltersProps) {
  const { 
    projects, 
    boardFilters, 
    setBoardFilters, 
    resetBoardFilters, 
    autoArchiveOldTasks,
    getArchiveStats,
  } = useToolingTrackerStore()
  const { toast } = useToast()
  const archiveStats = getArchiveStats()

  const hasActiveFilters =
    boardFilters.search !== "" ||
    boardFilters.projectId !== null ||
    boardFilters.priority !== "all" ||
    boardFilters.dateRange !== "all"

  const handleAutoArchive = () => {
    const count = autoArchiveOldTasks(30)
    if (count > 0) {
      toast({
        title: "Tasks archived",
        description: `${count} completed task${count > 1 ? "s" : ""} older than 30 days have been archived.`,
      })
    } else {
      toast({
        title: "No tasks to archive",
        description: "No completed tasks older than 30 days were found.",
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Main filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={boardFilters.search}
            onChange={(e) => setBoardFilters({ search: e.target.value })}
            className="pl-9 h-9"
          />
          {boardFilters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setBoardFilters({ search: "" })}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Project filter */}
        <Select
          value={boardFilters.projectId || "all"}
          onValueChange={(value) => setBoardFilters({ projectId: value === "all" ? null : value })}
        >
          <SelectTrigger className="w-40 h-9">
            <FolderKanban className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={boardFilters.priority}
          onValueChange={(value) => setBoardFilters({ priority: value as Priority | "all" })}
        >
          <SelectTrigger className="w-[130px] h-9">
            <Flag className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range filter */}
        <Select
          value={boardFilters.dateRange}
          onValueChange={(value) => {
            setBoardFilters({ 
              dateRange: value as typeof boardFilters.dateRange,
              // Clear custom dates when switching away from custom
              ...(value !== "custom" && { customStart: null, customEnd: null })
            })
          }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date range picker */}
        {boardFilters.dateRange === "custom" && (
          <DateRangePicker
            start={boardFilters.customStart}
            end={boardFilters.customEnd}
            onRangeChange={(start, end) => {
              setBoardFilters({ customStart: start, customEnd: end })
            }}
          />
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetBoardFilters} className="h-9">
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Archive toggle */}
        <Button
          variant={boardFilters.showArchived ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setBoardFilters({ showArchived: !boardFilters.showArchived })}
          className="h-9"
        >
          <Archive className="w-4 h-4 mr-2" />
          {boardFilters.showArchived ? "Viewing Archive" : "Archive"}
          {archiveStats.total > 0 && (
            <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
              {archiveStats.total}
            </Badge>
          )}
        </Button>

        {/* Auto-archive button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9">
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-cleanup
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">Auto-archive old tasks</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Archive completed tasks that have been done for more than 30 days.
                </p>
              </div>
              <Button onClick={handleAutoArchive} size="sm" className="w-full">
                <Archive className="w-4 h-4 mr-2" />
                Archive old tasks
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Selection mode toggle */}
        <Button
          variant={selectionMode ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleSelectionMode}
          className="h-9"
        >
          <Filter className="w-4 h-4 mr-2" />
          {selectionMode ? "Exit Selection" : "Select"}
        </Button>
      </div>

      {/* Bulk actions bar - visible when items selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear selection
          </Button>
          <Button variant="secondary" size="sm" onClick={onBulkArchive}>
            <Archive className="w-4 h-4 mr-2" />
            Archive selected
          </Button>
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            Delete selected
          </Button>
        </div>
      )}

      {/* Filter Presets */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="w-fit">
            <Filter className="w-4 h-4 mr-2" />
            Filter Presets
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <FilterPresetManager
            currentFilters={boardFilters}
            onApplyPreset={(filters) => {
              setBoardFilters(filters)
              toast({
                title: "Preset applied",
                description: "Filter preset has been applied.",
              })
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-3 h-3" />
          <span>Filters active:</span>
          {boardFilters.search && (
            <Badge variant="outline" className="text-xs py-0">
              Search: &quot;{boardFilters.search}&quot;
            </Badge>
          )}
          {boardFilters.projectId && (
            <Badge variant="outline" className="text-xs py-0">
              Project: {projects.find((p) => p.id === boardFilters.projectId)?.name}
            </Badge>
          )}
          {boardFilters.priority !== "all" && (
            <Badge variant="outline" className="text-xs py-0">
              Priority: {boardFilters.priority}
            </Badge>
          )}
          {boardFilters.dateRange !== "all" && (
            <Badge variant="outline" className="text-xs py-0">
              Date: {boardFilters.dateRange}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
