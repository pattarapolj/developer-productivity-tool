'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface DateRangePickerProps {
  start: Date | null
  end: Date | null
  onRangeChange: (start: Date | null, end: Date | null) => void
  className?: string
}

export function DateRangePicker({
  start,
  end,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStart, setTempStart] = useState<Date | undefined>(start || undefined)
  const [tempEnd, setTempEnd] = useState<Date | undefined>(end || undefined)

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onRangeChange(tempStart, tempEnd)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setTempStart(undefined)
    setTempEnd(undefined)
    onRangeChange(null, null)
  }

  const applyPreset = (presetStart: Date, presetEnd: Date) => {
    setTempStart(presetStart)
    setTempEnd(presetEnd)
    onRangeChange(presetStart, presetEnd)
    setIsOpen(false)
  }

  const applyToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)
    applyPreset(today, endOfDay)
  }

  const applyThisWeek = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
    endOfWeek.setHours(23, 59, 59, 999)
    
    applyPreset(startOfWeek, endOfWeek)
  }

  const applyThisMonth = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)
    
    applyPreset(startOfMonth, endOfMonth)
  }

  const formatDateRange = () => {
    if (!start || !end) return 'Select date range'
    
    const startStr = format(start, 'MMM d, yyyy')
    const endStr = format(end, 'MMM d, yyyy')
    
    return `${startStr} - ${endStr}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !start && !end && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Quick Select
            </Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={applyToday}
                className="h-7 text-xs"
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={applyThisWeek}
                className="h-7 text-xs"
              >
                This Week
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={applyThisMonth}
                className="h-7 text-xs"
              >
                This Month
              </Button>
            </div>
          </div>

          <Separator />

          {/* Calendar Selection */}
          <div className="grid gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Start Date</Label>
              <Calendar
                mode="single"
                selected={tempStart}
                onSelect={(date) => {
                  setTempStart(date)
                  // If end is before new start, clear end
                  if (tempEnd && date && tempEnd < date) {
                    setTempEnd(undefined)
                  }
                }}
                disabled={(date) => date > new Date()}
                className="rounded-md border"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">End Date</Label>
              <Calendar
                mode="single"
                selected={tempEnd}
                onSelect={setTempEnd}
                disabled={(date) => {
                  // Disable future dates and dates before start
                  if (date > new Date()) return true
                  if (tempStart && date < tempStart) return true
                  return false
                }}
                className="rounded-md border"
              />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={!start && !end}
              className="text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!tempStart || !tempEnd}
              className="text-xs"
            >
              Apply Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
