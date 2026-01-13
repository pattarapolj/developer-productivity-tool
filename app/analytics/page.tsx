"use client"

import { useState } from "react"

import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ThroughputChart } from "@/components/analytics/throughput-chart"
import { PriorityDistribution } from "@/components/analytics/priority-distribution"
import { TaskAging } from "@/components/analytics/task-aging"
import { WorkPatternHeatmap } from "@/components/analytics/work-pattern-heatmap"
import { ProjectFocusRatio } from "@/components/analytics/project-focus-ratio"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportDialog } from "@/components/export-dialog"
import { BarChart3, Clock, Target, Flame } from "lucide-react"

export default function AnalyticsPage() {
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track your productivity trends and performance</p>
          </div>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            Export to Excel
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="productivity" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Productivity</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ThroughputChart />
              <PriorityDistribution />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskAging />
              <PriorityDistribution />
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <WorkPatternHeatmap />
              <ProjectFocusRatio />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ExportDialog isOpen={exportOpen} onOpenChange={setExportOpen} />
    </div>
  )
}
