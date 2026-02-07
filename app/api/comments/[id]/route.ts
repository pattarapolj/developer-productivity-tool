import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaCommentToClient } from '@/lib/api-types'
import type { UpdateCommentRequest } from '@/lib/api-types'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comment = await (prisma as any).taskComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformPrismaCommentToClient(comment as any))
  } catch (error) {
    console.error('Failed to fetch comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body: UpdateCommentRequest = await request.json()

    // Validate required fields
    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify comment exists
    const existingComment = await (prisma as any).taskComment.findUnique({
      where: { id: params.id },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    const comment = await (prisma as any).taskComment.update({
      where: { id: params.id },
      data: {
        content: body.content.trim(),
      },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: existingComment.taskId,
        type: 'comment_updated',
        description: `Comment updated`,
        metadata: JSON.stringify({ commentId: params.id }),
      },
    })

    return NextResponse.json(transformPrismaCommentToClient(comment as any))
  } catch (error) {
    console.error('Failed to update comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify comment exists
    const comment = await (prisma as any).taskComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    await (prisma as any).taskComment.delete({
      where: { id: params.id },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: comment.taskId,
        type: 'comment_deleted',
        description: `Comment deleted`,
        metadata: JSON.stringify({ commentId: params.id }),
      },
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
