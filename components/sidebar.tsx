"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn, getProjectColorClass } from "@/lib/utils"
import { useToolingTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  BarChart3,
  Plus,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProjectColor } from "@/lib/types"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/board", icon: KanbanSquare, label: "Board" },
  { href: "/projects", icon: FolderOpen, label: "Projects" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
]

const projectColors: { value: ProjectColor; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { projects, setSelectedProject, addProject } = useToolingTrackerStore()
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState<ProjectColor>("blue")
  const [newProjectKey, setNewProjectKey] = useState("")

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor, newProjectKey.trim() || null)
      setNewProjectName("")
      setNewProjectColor("blue")
      setNewProjectKey("")
      setDialogOpen(false)
    }
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">ToolingTracker</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70"
          >
            Projects
            {projectsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {projectsExpanded && (
            <div className="mt-1 space-y-1">
              <Link
                href="/projects"
                onClick={() => setSelectedProject(null)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === "/projects"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <div className="w-2 h-2 rounded-full bg-sidebar-foreground/30" />
                All Projects
              </Link>

              {projects.map((project) => {
                const projectHref = `/projects/${project.id}`
                const isActive = pathname?.startsWith(projectHref)
                return (
                  <Link
                    key={project.id}
                    href={projectHref}
                    onClick={() => setSelectedProject(project.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn("w-2 h-2 rounded-full", getProjectColorClass(project.color))} />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {project.jiraKey && (
                      <span className="text-[11px] uppercase tracking-wide text-sidebar-foreground/40">{project.jiraKey}</span>
                    )}
                  </Link>
                )
              })}

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        placeholder="Enter project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jira Key (optional)</label>
                      <Input
                        placeholder="e.g. ENG"
                        value={newProjectKey}
                        onChange={(e) => setNewProjectKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color</label>
                      <Select value={newProjectColor} onValueChange={(v) => setNewProjectColor(v as ProjectColor)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {projectColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", getProjectColorClass(color.value))} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddProject} className="w-full">
                      Create Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
