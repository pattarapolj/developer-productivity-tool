import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaCommentToClient } from '@/lib/api-types'
import type { CreateCommentRequest } from '@/lib/api-types'

export async function GET(request?: NextRequest) {
  try {
    const url = new URL(request?.url || 'http://localhost:3000')
    const taskId = url.searchParams.get('taskId')

    const where = taskId ? { taskId } : {}

    const comments = await (prisma as any).taskComment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments.map(transformPrismaCommentToClient))
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCommentRequest = await request.json()

    // Validate required fields
    if (!body.taskId?.trim()) {
      return NextResponse.json(
        { error: 'Task ID (taskId) is required' },
        { status: 400 }
      )
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: body.taskId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await (prisma as any).taskComment.create({
      data: {
        taskId: body.taskId,
        content: body.content.trim(),
      },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: body.taskId,
        projectId: task.projectId,
        type: 'comment_added',
        description: `Comment added: "${body.content.trim().substring(0, 50)}..."`,
        metadata: JSON.stringify({ commentId: comment.id }),
      },
    })

    return NextResponse.json(transformPrismaCommentToClient(comment as any), { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
