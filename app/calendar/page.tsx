"use client"

import { CalendarView } from "@/components/calendar-view"

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">View tasks by due date</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <CalendarView />
      </div>
    </div>
  )
}
