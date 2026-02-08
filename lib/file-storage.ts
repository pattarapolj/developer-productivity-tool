import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = 'public/uploads/boards'

/**
 * Saves a board image to the file system
 * @param boardId - The ID of the board
 * @param file - The image file to save
 * @returns The public path to the saved image
 */
export async function saveBoardImage(boardId: string, file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Only image files are allowed.')
  }

  // Get file extension
  const filename = file.name
  const ext = path.extname(filename) || '.png'
  
  // Generate unique filename with timestamp and random string
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const uniqueFilename = `${timestamp}-${randomStr}${ext}`

  // Create board directory path
  const boardDir = path.join(UPLOAD_DIR, boardId)
  
  // Ensure directory exists
  await fs.mkdir(boardDir, { recursive: true })

  // Save file to disk
  const filePath = path.join(boardDir, uniqueFilename)
  const buffer = await file.arrayBuffer()
  await fs.writeFile(filePath, Buffer.from(buffer))

  // Return public path
  return getBoardImagePath(boardId, uniqueFilename)
}

/**
 * Deletes all images for a board
 * @param boardId - The ID of the board
 */
export async function deleteBoardImages(boardId: string): Promise<void> {
  const boardDir = path.join(UPLOAD_DIR, boardId)
  
  try {
    await fs.rm(boardDir, { recursive: true, force: true })
  } catch (error) {
    // Directory may not exist, which is fine
    console.warn(`Failed to delete board images for ${boardId}:`, error)
  }
}

/**
 * Returns the public path for a board image
 * @param boardId - The ID of the board
 * @param filename - The filename of the image
 * @returns The public path like /uploads/boards/[boardId]/[filename]
 */
export function getBoardImagePath(boardId: string, filename: string): string {
  return `/uploads/boards/${boardId}/${filename}`
}
