'use client'

import React from 'react'
import { useStoreHydration } from '@/hooks/use-store-hydration'

interface StoreHydrationProps {
  children: React.ReactNode
}

/**
 * StoreHydration component - Wraps app layout to hydrate store data from database on mount
 * Shows loading UI while data is being fetched, then renders children once hydrated
 */
export function StoreHydration({ children }: StoreHydrationProps) {
  const { isHydrating, error } = useStoreHydration()

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-md">
          <h2 className="text-lg font-semibold text-destructive">Failed to Load Data</h2>
          <p className="text-sm text-muted-foreground text-center">{error}</p>
          <p className="text-xs text-muted-foreground">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
