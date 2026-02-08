import { NextRequest, NextResponse } from 'next/server'
import { saveBoardImage } from '@/lib/file-storage'

/**
 * POST /api/boards/[id]/upload
 * Handles image uploads for whiteboards
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const boardId = id

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image files are allowed.' },
        { status: 400 }
      )
    }

    // Save image
    const imageUrl = await saveBoardImage(boardId, file)

    return NextResponse.json({ url: imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Failed to upload board image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
