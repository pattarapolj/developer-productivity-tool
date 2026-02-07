import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Sidebar } from "@/components/sidebar"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

// <CHANGE> Updated metadata for ToolingTracker
export const metadata: Metadata = {
  title: "ToolingTracker - Developer Productivity",
  description: "Track tasks, manage projects, log time, and analyze productivity"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-hidden bg-background">{children}</main>
          </div>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
