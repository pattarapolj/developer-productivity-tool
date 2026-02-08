import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaTimeEntryToClient } from '@/lib/api-types'
import type { UpdateTimeEntryRequest } from '@/lib/api-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformPrismaTimeEntryToClient(entry as any))
  } catch (error) {
    console.error('Failed to fetch time entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entry' },
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
    const body: UpdateTimeEntryRequest = await request.json()

    // Verify entry exists
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (body.hours !== undefined) updateData.hours = body.hours
    if (body.minutes !== undefined) updateData.minutes = body.minutes
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.notes !== undefined) updateData.notes = body.notes.trim()
    if (body.type !== undefined) updateData.type = body.type

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
    })

    // Fetch task to get projectId for Activity
    const task = await prisma.task.findUnique({
      where: { id: existingEntry.taskId },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: existingEntry.taskId,
        projectId: task?.projectId,
        type: 'time_updated',
        description: `Time entry updated`,
        metadata: JSON.stringify(updateData),
      },
    })

    return NextResponse.json(transformPrismaTimeEntryToClient(entry as any))
  } catch (error) {
    console.error('Failed to update time entry:', error)
    return NextResponse.json(
      { error: 'Failed to update time entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verify entry exists
    const entry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    await prisma.timeEntry.delete({
      where: { id },
    })

    // Fetch task to get projectId for Activity
    const task = await prisma.task.findUnique({
      where: { id: entry.taskId },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: entry.taskId,
        projectId: task?.projectId,
        type: 'time_deleted',
        description: `Time entry deleted`,
        metadata: JSON.stringify({ hours: entry.hours, minutes: entry.minutes }),
      },
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete time entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}
