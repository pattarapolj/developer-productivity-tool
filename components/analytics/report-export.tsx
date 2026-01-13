'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Download, Share2, FileText, Copy, Check } from 'lucide-react'
import { useToolingTrackerStore } from '@/lib/store'
import type { Priority } from '@/lib/types'
import type { ReportType, PDFReportData } from '@/lib/pdf-generator'
import { generatePDF, downloadPDF } from '@/lib/pdf-generator'
import { generateShareableURL, copyToClipboard, type ShareableFilters } from '@/lib/report-sharing'

interface ReportExportProps {
  reportType: ReportType
  reportTitle: string
  reportData: PDFReportData
  filters?: ShareableFilters
}

export function ReportExport({ reportType, reportTitle, reportData, filters = {} }: ReportExportProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { boardFilters, selectedProjectId, projects } = useToolingTrackerStore()

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const doc = generatePDF(reportData)
      const filename = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`
      downloadPDF(doc, filename)
      
      toast({
        title: 'Export Successful',
        description: `${reportTitle} exported as PDF`,
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareLink = async () => {
    try {
      const project = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
      
      const shareFilters: ShareableFilters = {
        ...filters,
        reportType,
        projectId: selectedProjectId || boardFilters.projectId || undefined,
        priority: (boardFilters.priority && boardFilters.priority !== 'all') ? boardFilters.priority as Priority : undefined,
        search: boardFilters.search || undefined,
        // Note: boardFilters.dateRange is a preset string, actual date range handling
        // would need to be done in the report component itself
      }

      const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const shareURL = generateShareableURL(baseURL, '/analytics', shareFilters)
      
      const success = await copyToClipboard(shareURL)
      
      if (success) {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        
        toast({
          title: 'Link Copied',
          description: 'Shareable link copied to clipboard',
        })
      } else {
        throw new Error('Clipboard access denied')
      }
    } catch (error) {
      console.error('Share link error:', error)
      toast({
        title: 'Share Failed',
        description: 'Failed to generate shareable link',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {reportTitle}
            </CardTitle>
            <CardDescription>Export or share this report</CardDescription>
          </div>
          <Badge variant="outline">{reportType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </Button>
          <Button
            onClick={handleShareLink}
            variant="outline"
            className="flex-1"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </>
            )}
          </Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• PDF export includes all report sections and data tables</p>
          <p>• Shared links preserve current filters and date ranges</p>
          <p>• Reports reflect data at the time of generation</p>
        </div>
      </CardContent>
    </Card>
  )
}
