import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaBoardToClient } from '@/lib/api-types'

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      where: { isArchived: false },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(boards.map(transformPrismaBoardToClient))
  } catch (error) {
    console.error('Failed to fetch boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    // Create board with proper fields
    const now = new Date()
    const board = await prisma.board.create({
      data: {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15),
        name: body.name.trim(),
        projectId: body.projectId || null,
        content: body.content || '{}',
        thumbnailPath: body.thumbnailPath || null,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      }
    })

    return NextResponse.json(transformPrismaBoardToClient(board), { status: 201 })
  } catch (error) {
    console.error('Failed to create board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
