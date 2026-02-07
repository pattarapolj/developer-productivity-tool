import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaTaskToClient } from '@/lib/api-types'
import type { CreateTaskRequest } from '@/lib/api-types'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(tasks.map(transformPrismaTaskToClient))
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId }
    })
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create task with proper date handling
    const now = new Date()
    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || '',
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        projectId: body.projectId,
        subcategory: body.subcategory?.trim() || null,
        jiraKey: body.jiraKey?.trim() || null,
        storyPoints: body.storyPoints || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedAt: body.status === 'done' ? now : null,
        isArchived: false,
        blockedBy: JSON.stringify([]),
        blocking: JSON.stringify([]),
      }
    })

    // Auto-generate Activity record
    await prisma.activity.create({
      data: {
        taskId: task.id,
        projectId: body.projectId,
        type: 'task_created',
        description: `Task "${task.title}" created`,
        metadata: JSON.stringify({ projectId: body.projectId, status: task.status }),
      }
    })

    return NextResponse.json(transformPrismaTaskToClient(task), { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
