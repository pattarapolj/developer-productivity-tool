import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaActivityToClient } from '@/lib/api-types'

export async function GET(request?: NextRequest) {
  try {
    const url = new URL(request?.url || 'http://localhost:3000')
    const taskId = url.searchParams.get('taskId')
    const projectId = url.searchParams.get('projectId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const where: any = {}

    if (taskId) {
      where.taskId = taskId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(activities.map(transformPrismaActivityToClient))
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
