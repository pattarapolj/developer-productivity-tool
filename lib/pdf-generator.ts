import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type ReportType = 
  | 'focus-time'
  | 'daily-standup'
  | 'weekly-summary'
  | 'velocity-tracker'
  | 'task-efficiency'

export interface ReportMetadata {
  title: string
  generatedAt: Date
  dateRange?: {
    from: Date | null
    to: Date | null
  }
  projectId?: string
  projectName?: string
}

export interface PDFTableData {
  headers: string[]
  rows: (string | number)[][]
}

export interface PDFChartData {
  type: 'bar' | 'line' | 'pie'
  data: { label: string; value: number }[]
}

export interface PDFSection {
  title: string
  content?: string
  table?: PDFTableData
  charts?: PDFChartData[]
}

export interface PDFReportData {
  metadata: ReportMetadata
  sections: PDFSection[]
}

/**
 * Generate PDF from report data
 */
export function generatePDF(reportData: PDFReportData): jsPDF {
  const doc = new jsPDF()
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(reportData.metadata.title, 20, yPosition)
  yPosition += 10

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${reportData.metadata.generatedAt.toLocaleString()}`, 20, yPosition)
  yPosition += 6

  if (reportData.metadata.dateRange?.from || reportData.metadata.dateRange?.to) {
    const fromStr = reportData.metadata.dateRange.from?.toLocaleDateString() || 'Start'
    const toStr = reportData.metadata.dateRange.to?.toLocaleDateString() || 'End'
    doc.text(`Date Range: ${fromStr} - ${toStr}`, 20, yPosition)
    yPosition += 6
  }

  if (reportData.metadata.projectName) {
    doc.text(`Project: ${reportData.metadata.projectName}`, 20, yPosition)
    yPosition += 6
  }

  yPosition += 5

  // Sections
  reportData.sections.forEach((section, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Section title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(section.title, 20, yPosition)
    yPosition += 8

    // Section content (text)
    if (section.content) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(section.content, 170)
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 20, yPosition)
        yPosition += 5
      })
      yPosition += 5
    }

    // Section table
    if (section.table) {
      autoTable(doc, {
        startY: yPosition,
        head: [section.table.headers],
        body: section.table.rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { left: 20 },
      })
      // @ts-ignore - autoTable adds finalY to doc
      yPosition = doc.lastAutoTable.finalY + 10
    }

    // Chart placeholders (simplified text representation for now)
    if (section.charts && section.charts.length > 0) {
      section.charts.forEach((chart) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.text(`Chart: ${chart.type.toUpperCase()}`, 20, yPosition)
        yPosition += 6

        // Show top 5 data points
        chart.data.slice(0, 5).forEach((item) => {
          doc.setFont('helvetica', 'normal')
          doc.text(`  ${item.label}: ${item.value}`, 25, yPosition)
          yPosition += 5
        })
        yPosition += 5
      })
    }

    yPosition += 5
  })

  return doc
}

/**
 * Download PDF file
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename)
}

/**
 * Get PDF as base64 string
 */
export function getPDFBase64(doc: jsPDF): string {
  return doc.output('dataurlstring')
}

/**
 * Get PDF as blob
 */
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob')
}
