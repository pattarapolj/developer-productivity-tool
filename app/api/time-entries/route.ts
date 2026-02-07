import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaTimeEntryToClient } from '@/lib/api-types'
import type { CreateTimeEntryRequest } from '@/lib/api-types'

export async function GET(request?: NextRequest) {
  try {
    const url = new URL(request?.url || 'http://localhost:3000')
    const taskId = url.searchParams.get('taskId')

    const where = taskId ? { taskId } : {}

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(entries.map(e => transformPrismaTimeEntryToClient(e as any)))
  } catch (error) {
    console.error('Failed to fetch time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTimeEntryRequest = await request.json()

    // Validate required fields
    if (!body.taskId?.trim()) {
      return NextResponse.json(
        { error: 'Task ID (taskId) is required' },
        { status: 400 }
      )
    }

    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' },
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

    // Create time entry with defaults
    const entryData = {
      taskId: body.taskId,
      date: new Date(body.date),
      hours: body.hours || 0,
      minutes: body.minutes || 0,
      notes: body.notes?.trim() || '',
      type: body.type || 'development',
    }

    const entry = await prisma.timeEntry.create({
      data: entryData as any,
    })

    // Auto-generate Activity record
    const type = (body.type || 'development') as string
    await (prisma as any).activity.create({
      data: {
        taskId: body.taskId,
        projectId: task.projectId,
        type: 'time_logged',
        description: `Time logged: ${entry.hours}h ${entry.minutes}m (${type})`,
        metadata: JSON.stringify({
          hours: entry.hours,
          minutes: entry.minutes,
          type,
        }),
      },
    })

    return NextResponse.json(transformPrismaTimeEntryToClient(entry as any), { status: 201 })
  } catch (error) {
    console.error('Failed to create time entry:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}
