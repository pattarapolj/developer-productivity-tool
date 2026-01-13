"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToolingTrackerStore } from "@/lib/store"
import { SAMPLE_PROJECTS, SAMPLE_TASKS, SAMPLE_TIME_ENTRIES } from "@/scripts/seed-data"
import { Database, Trash2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DevToolsPage() {
  const { seedSampleData, clearAllData, projects, tasks, timeEntries } = useToolingTrackerStore()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSeedData = () => {
    try {
      seedSampleData({
        projects: SAMPLE_PROJECTS,
        tasks: SAMPLE_TASKS,
        timeEntries: SAMPLE_TIME_ENTRIES,
      })
      setMessage({
        type: "success",
        text: `Seeded ${SAMPLE_PROJECTS.length} projects, ${SAMPLE_TASKS.length} tasks, and ${SAMPLE_TIME_ENTRIES.length} time entries!`,
      })
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to seed data: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  const handleClearData = () => {
    try {
      clearAllData()
      setMessage({
        type: "success",
        text: "All data has been cleared!",
      })
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to clear data: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Developer Tools</h1>
            <p className="text-muted-foreground">Manage sample data for testing</p>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current Data Status</CardTitle>
            <CardDescription>What&apos;s currently in your local storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{tasks.length}</div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{timeEntries.length}</div>
                <div className="text-sm text-muted-foreground">Time Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Data</CardTitle>
            <CardDescription>
              Load example projects, tasks, and time entries for testing.
              This will replace all existing data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>This will add:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{SAMPLE_PROJECTS.length} projects (Frontend, Backend, DevOps, Mobile, Learning)</li>
                <li>{SAMPLE_TASKS.length} tasks with various statuses and priorities</li>
                <li>{SAMPLE_TIME_ENTRIES.length} time entries spread across the last 60 days</li>
              </ul>
            </div>
            <Button onClick={handleSeedData} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Seed Sample Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clear All Data</CardTitle>
            <CardDescription>
              Remove all projects, tasks, and time entries.
              This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClearData} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alternative: Browser Console</CardTitle>
            <CardDescription>
              You can also manage data directly in the browser console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">To clear data via console:</p>
                <code className="block p-2 bg-muted rounded text-xs">
                  localStorage.removeItem(&apos;ToolingTracker-storage&apos;); location.reload();
                </code>
              </div>
              <div>
                <p className="font-medium mb-1">To view current data:</p>
                <code className="block p-2 bg-muted rounded text-xs">
                  JSON.parse(localStorage.getItem(&apos;ToolingTracker-storage&apos;))
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
