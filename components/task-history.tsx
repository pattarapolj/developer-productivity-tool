'use client'

import { useToolingTrackerStore } from '@/lib/store'
import { Clock, ArrowRight, AlertCircle } from 'lucide-react'
import type { HistoryEntry } from '@/lib/types'

interface TaskHistoryProps {
  taskId: string
}

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const { getFormattedHistory } = useToolingTrackerStore()
  const history = getFormattedHistory(taskId)

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  const groupByDate = (entries: HistoryEntry[]) => {
    const groups: Record<string, HistoryEntry[]> = {}
    
    entries.forEach((entry) => {
      const date = new Date(entry.changedAt)
      const dateKey = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
      })
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })
    
    return groups
  }

  const getChangeIcon = (changeType: HistoryEntry['changeType']) => {
    switch (changeType) {
      case 'status_changed':
        return <ArrowRight className="w-3 h-3" />
      case 'created':
        return <Clock className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getChangeColor = (changeType: HistoryEntry['changeType']) => {
    switch (changeType) {
      case 'status_changed':
        return 'text-blue-500'
      case 'created':
        return 'text-green-500'
      default:
        return 'text-yellow-500'
    }
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No history yet. Changes will appear here.
      </div>
    )
  }

  const groupedHistory = groupByDate(history)

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory).map(([date, entries]) => (
        <div key={date}>
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {date}
          </div>
          <div className="space-y-3 pl-3 border-l-2 border-border">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-6">
                <div className={`absolute left-0 top-1 -translate-x-1/2 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center ${getChangeColor(entry.changeType)}`}>
                  {getChangeIcon(entry.changeType)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{entry.fieldLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.changedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {entry.oldValueFormatted && (
                      <>
                        <span className="text-muted-foreground line-through">
                          {entry.oldValueFormatted}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </>
                    )}
                    <span className="font-medium">
                      {entry.newValueFormatted || '(empty)'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
