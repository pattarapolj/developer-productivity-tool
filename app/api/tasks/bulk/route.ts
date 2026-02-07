import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.operation) {
      return NextResponse.json(
        { error: 'Operation is required (archive or delete)' },
        { status: 400 }
      )
    }

    if (!body.taskIds || !Array.isArray(body.taskIds) || body.taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Task IDs (taskIds) are required as a non-empty array' },
        { status: 400 }
      )
    }

    if (!['archive', 'delete'].includes(body.operation)) {
      return NextResponse.json(
        { error: 'Operation must be either "archive" or "delete"' },
        { status: 400 }
      )
    }

    // Verify all tasks exist
    const existingTasks = await prisma.task.findMany({
      where: { id: { in: body.taskIds } },
      select: { id: true, projectId: true, title: true },
    })

    if (existingTasks.length !== body.taskIds.length) {
      const foundIds = existingTasks.map((t) => t.id)
      const missingIds = body.taskIds.filter((id: string) => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Tasks not found: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }

    let affectedCount = 0

    if (body.operation === 'archive') {
      await prisma.task.updateMany({
        where: { id: { in: body.taskIds } },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        } as any,
      })

      // Create activities for archived tasks
      const activities = existingTasks.map((task) => ({
        taskId: task.id,
        projectId: task.projectId,
        type: 'task_archived',
        description: `Task "${task.title}" archived`,
        metadata: JSON.stringify({}),
      }))

      await (prisma as any).activity.createMany({
        data: activities,
      })

      affectedCount = existingTasks.length
    } else if (body.operation === 'delete') {
      // First create activities before deleting (since cascade will happen)
      const activities = existingTasks.map((task) => ({
        taskId: task.id,
        projectId: task.projectId,
        type: 'task_deleted',
        description: `Task "${task.title}" deleted`,
        metadata: JSON.stringify({}),
      }))

      await (prisma as any).activity.createMany({
        data: activities,
      })

      await prisma.task.deleteMany({
        where: { id: { in: body.taskIds } },
      })

      affectedCount = existingTasks.length
    }

    return NextResponse.json({
      success: true,
      affected: affectedCount,
    })
  } catch (error) {
    console.error('Failed to perform bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
