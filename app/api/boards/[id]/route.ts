import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaBoardToClient } from '@/lib/api-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const board = await prisma.board.findUnique({
      where: { id }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformPrismaBoardToClient(board))
  } catch (error) {
    console.error('Failed to fetch board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Build update data - only update provided fields
    const updateData: Record<string, unknown> = {}
    const now = new Date()

    if (body.name !== undefined) updateData.name = body.name
    if (body.content !== undefined) updateData.content = body.content
    if (body.thumbnailPath !== undefined) updateData.thumbnailPath = body.thumbnailPath
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived
    if (body.projectId !== undefined) updateData.projectId = body.projectId

    updateData.updatedAt = now

    // Update board
    const board = await prisma.board.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(transformPrismaBoardToClient(board))
  } catch (error) {
    if ((error as any).code === 'P2025') {
      // Prisma "not found" error
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    console.error('Failed to update board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.board.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    console.error('Failed to delete board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}
