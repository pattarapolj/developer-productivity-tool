import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function getProjectColorClass(color: string): string {
  const colors: Record<string, string> = {
    blue: "bg-project-blue",
    green: "bg-project-green",
    purple: "bg-project-purple",
    orange: "bg-project-orange",
    pink: "bg-project-pink",
  }
  return colors[color] || colors.blue
}

export function getPriorityColorClass(priority: string): string {
  const colors: Record<string, string> = {
    low: "text-priority-low",
    medium: "text-priority-medium",
    high: "text-priority-high",
  }
  return colors[priority] || colors.medium
}
