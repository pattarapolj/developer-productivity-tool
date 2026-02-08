"use client"

import { useState } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BoardCard } from "@/components/board-card"
import { CreateBoardDialog } from "@/components/create-board-dialog"
import { Plus } from "lucide-react"

export default function WhiteboardsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const { boards, projects } = useToolingTrackerStore()

  // Filter boards by search and project
  const filteredBoards = boards.filter((board) => {
    // Filter by search query
    if (searchQuery && !board.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filter by project
    if (selectedProject && board.projectId !== selectedProject) {
      return false
    }

    return true
  })

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Whiteboards</h1>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 items-center">
        <Input
          placeholder="Search boards by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-sm"
        />

        <Select value={selectedProject || 'all'} onValueChange={(value) => setSelectedProject(value === 'all' ? null : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board Grid or Empty State */}
      <div className="flex-1 overflow-y-auto">
        {filteredBoards.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-muted-foreground mb-4">
                {boards.length === 0 ? (
                  <>
                    <p className="text-lg font-medium">No whiteboards yet</p>
                    <p className="text-sm">Create your first board to get started</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">No matches found</p>
                    <p className="text-sm">Try adjusting your search or filter</p>
                  </>
                )}
              </div>
              {boards.length === 0 && (
                <Button onClick={() => setCreateOpen(true)}>
                  Create First Board
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </div>

      {/* Create Board Dialog */}
      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
