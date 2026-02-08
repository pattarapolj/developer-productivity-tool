/**
 * Whiteboard Export Functions
 * Exports Excalidraw content to various formats (PNG, SVG, PDF)
 */

import { exportToBlob } from '@excalidraw/excalidraw'
import jsPDF from 'jspdf'

export interface ExportOptions {
  mimeType?: string
  quality?: number
  pixelRatio?: number
}

/**
 * Exports board to PNG format
 * @param elements - Excalidraw elements
 * @param appState - Excalidraw app state
 * @returns Blob containing PNG image
 */
export async function exportToPNG(
  elements: any[],
  appState: any
): Promise<Blob> {
  try {
    const blob = await exportToBlob({
      elements,
      appState,
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2,
    })

    if (!blob) {
      throw new Error('Failed to export as PNG')
    }

    return blob
  } catch (error) {
    console.error('Error exporting to PNG:', error)
    throw error
  }
}

/**
 * Exports board to SVG format
 * @param elements - Excalidraw elements
 * @param appState - Excalidraw app state
 * @returns Blob containing SVG image
 */
export async function exportToSVG(
  elements: any[],
  appState: any
): Promise<Blob> {
  try {
    const blob = await exportToBlob({
      elements,
      appState,
      mimeType: 'image/svg+xml',
      quality: 1,
      pixelRatio: 2,
    })

    if (!blob) {
      throw new Error('Failed to export as SVG')
    }

    return blob
  } catch (error) {
    console.error('Error exporting to SVG:', error)
    throw error
  }
}

/**
 * Exports board to PDF format
 * @param elements - Excalidraw elements
 * @param appState - Excalidraw app state
 * @returns Blob containing PDF document
 */
export async function exportToPDF(
  elements: any[],
  appState: any
): Promise<Blob> {
  try {
    // First export as PNG to embed in PDF
    const pngBlob = await exportToBlob({
      elements,
      appState,
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2,
    })

    // Read PNG as base64
    const base64 = await blobToBase64(pngBlob)

    // Create PDF with image
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
      hotfixes: ['px_scaling'],
    })

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Add image to PDF
    pdf.addImage(base64, 'PNG', 0, 0, pageWidth, pageHeight)

    // Convert PDF to Blob
    const pdfBlob = pdf.output('blob')

    return pdfBlob
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw error
  }
}

/**
 * Helper function to convert Blob to Base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(reader.result as string)
    })
    reader.addEventListener('error', () => {
      reject(new Error('Failed to read blob as base64'))
    })
    reader.readAsDataURL(blob)
  })
}

/**
 * Downloads a blob as a file
 * @param blob - Blob to download
 * @param filename - Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    // Create blob URL
    const blobUrl = URL.createObjectURL(blob)

    // Create anchor element and trigger download
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.setAttribute('download', filename)
    document.body.appendChild(anchor)
    anchor.click()

    // Cleanup
    document.body.removeChild(anchor)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading blob:', error)
    throw error
  }
}
