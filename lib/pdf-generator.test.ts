import { describe, it, expect } from 'vitest'
import { generatePDF, getPDFBase64, getPDFBlob, type PDFReportData } from './pdf-generator'

describe('PDF Generator', () => {
  const mockReportData: PDFReportData = {
    metadata: {
      title: 'Test Report',
      generatedAt: new Date('2024-01-15T10:00:00'),
      dateRange: {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      },
      projectName: 'Test Project',
    },
    sections: [
      {
        title: 'Summary',
        content: 'This is a test summary section.',
      },
      {
        title: 'Data Table',
        table: {
          headers: ['Task', 'Status', 'Hours'],
          rows: [
            ['Task 1', 'Done', 5],
            ['Task 2', 'In Progress', 3],
            ['Task 3', 'To Do', 0],
          ],
        },
      },
      {
        title: 'Chart Data',
        charts: [
          {
            type: 'bar',
            data: [
              { label: 'Development', value: 20 },
              { label: 'Testing', value: 10 },
              { label: 'Review', value: 5 },
            ],
          },
        ],
      },
    ],
  }

  it('generates PDF document', () => {
    const pdf = generatePDF(mockReportData)
    expect(pdf).toBeDefined()
    expect(typeof pdf.save).toBe('function')
    expect(typeof pdf.output).toBe('function')
  })

  it('PDF contains content when converted to string', () => {
    const pdf = generatePDF(mockReportData)
    const pdfData = pdf.output('arraybuffer')
    expect(pdfData).toBeDefined()
    expect(pdfData.byteLength).toBeGreaterThan(0)
  })

  it('PDF has multiple pages for large content', () => {
    const largePDF = generatePDF({
      metadata: {
        title: 'Large Report',
        generatedAt: new Date(),
      },
      sections: Array.from({ length: 20 }, (_, i) => ({
        title: `Section ${i + 1}`,
        content: 'Lorem ipsum '.repeat(100),
      })),
    })
    expect(largePDF.getNumberOfPages()).toBeGreaterThan(1)
  })

  it('converts PDF to base64', () => {
    const pdf = generatePDF(mockReportData)
    const base64 = getPDFBase64(pdf)
    expect(base64).toBeDefined()
    expect(typeof base64).toBe('string')
    expect(base64).toMatch(/^data:application\/pdf/)
  })

  it('converts PDF to blob', () => {
    const pdf = generatePDF(mockReportData)
    const blob = getPDFBlob(pdf)
    expect(blob).toBeDefined()
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })

  it('handles empty sections array', () => {
    const emptyReportData: PDFReportData = {
      metadata: {
        title: 'Empty Report',
        generatedAt: new Date(),
      },
      sections: [],
    }
    const pdf = generatePDF(emptyReportData)
    expect(pdf).toBeDefined()
  })

  it('handles missing optional metadata fields', () => {
    const minimalReportData: PDFReportData = {
      metadata: {
        title: 'Minimal Report',
        generatedAt: new Date(),
      },
      sections: [
        {
          title: 'Section 1',
          content: 'Content',
        },
      ],
    }
    const pdf = generatePDF(minimalReportData)
    expect(pdf).toBeDefined()
  })

  it('handles long content text', () => {
    const longContentData: PDFReportData = {
      metadata: {
        title: 'Long Content Report',
        generatedAt: new Date(),
      },
      sections: [
        {
          title: 'Long Section',
          content: 'Lorem ipsum '.repeat(200), // Very long text
        },
      ],
    }
    const pdf = generatePDF(longContentData)
    expect(pdf).toBeDefined()
  })

  it('handles multiple sections', () => {
    const multiSectionData: PDFReportData = {
      metadata: {
        title: 'Multi-Section Report',
        generatedAt: new Date(),
      },
      sections: Array.from({ length: 10 }, (_, i) => ({
        title: `Section ${i + 1}`,
        content: `Content for section ${i + 1}`,
      })),
    }
    const pdf = generatePDF(multiSectionData)
    expect(pdf).toBeDefined()
  })
})
