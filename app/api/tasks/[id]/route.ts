import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaTaskToClient } from '@/lib/api-types'
import type { UpdateTaskRequest } from '@/lib/api-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformPrismaTaskToClient(task))
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: UpdateTaskRequest = await request.json()

    // Fetch existing task to compare changes
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const now = new Date()

    // Build update data
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || ''
    if (body.status !== undefined) {
      updateData.status = body.status
      // Set completedAt if status changed to 'done'
      if (body.status === 'done' && existingTask.status !== 'done') {
        updateData.completedAt = now
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory?.trim() || null
    if (body.jiraKey !== undefined) updateData.jiraKey = body.jiraKey?.trim() || null
    if (body.storyPoints !== undefined) updateData.storyPoints = body.storyPoints || null
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived
    if (body.archivedAt !== undefined) updateData.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null
    if (body.blockedBy !== undefined) updateData.blockedBy = JSON.stringify(body.blockedBy || [])
    if (body.blocking !== undefined) updateData.blocking = JSON.stringify(body.blocking || [])

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: { ...updateData, updatedAt: now }
    })

    // Create Activity if status changed
    if (body.status && body.status !== existingTask.status) {
      await prisma.activity.create({
        data: {
          taskId: id,
          projectId: task.projectId,
          type: 'task_status_changed',
          description: `Status changed from ${existingTask.status} to ${body.status}`,
          metadata: JSON.stringify({ oldStatus: existingTask.status, newStatus: body.status }),
        }
      })
    }

    // Track field changes in History
    for (const [field, newValue] of Object.entries(updateData)) {
      if (field === 'updatedAt') continue
      const oldValue = existingTask[field as keyof typeof existingTask]
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        await prisma.taskHistory.create({
          data: {
            taskId: id,
            field,
            oldValue: String(oldValue ?? ''),
            newValue: String(newValue ?? ''),
          }
        })
      }
    }

    return NextResponse.json(transformPrismaTaskToClient(task))
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if task exists first
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete task (cascades to time entries automatically)
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({
      message: `Task "${existingTask.title}" deleted successfully`
    })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
