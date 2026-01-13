"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  className?: string
  showIcon?: boolean
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TrendIndicator({
  direction,
  percentage,
  className,
  showIcon = true,
  showPercentage = true,
  size = 'md',
}: TrendIndicatorProps) {
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  const colorClass = direction === 'up' 
    ? 'text-green-500 bg-green-500/10 border-green-500/20' 
    : direction === 'down' 
    ? 'text-red-500 bg-red-500/10 border-red-500/20'
    : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'

  const formattedPercentage = percentage > 0 ? `+${percentage}%` : `${percentage}%`

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 font-medium",
        colorClass,
        className
      )}
    >
      {showIcon && <Icon className={iconSize} />}
      {showPercentage && (
        <span className={textSize}>{formattedPercentage}</span>
      )}
    </Badge>
  )
}
