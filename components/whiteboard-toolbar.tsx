'use client'

import { Download, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WhiteboardToolbarProps {
  onExportPNG: () => void | Promise<void>
  onExportSVG: () => void | Promise<void>
  onExportPDF: () => void | Promise<void>
  onPresentationMode: () => void | Promise<void>
}

export function WhiteboardToolbar({
  onExportPNG,
  onExportSVG,
  onExportPDF,
  onPresentationMode,
}: WhiteboardToolbarProps) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 backdrop-blur border border-slate-700"
      data-testid="whiteboard-toolbar"
    >
      {/* Export Button with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-slate-700"
            aria-label="Export whiteboard"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPNG} className="cursor-pointer">
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportSVG} className="cursor-pointer">
            Export as SVG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Presentation Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-slate-700"
        onClick={onPresentationMode}
        aria-label="Start presentation mode"
      >
        <Play className="h-4 w-4 mr-2" />
        Present
      </Button>
    </div>
  )
}
