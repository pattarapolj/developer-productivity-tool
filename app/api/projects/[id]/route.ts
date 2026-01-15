import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaProjectToClient } from '@/lib/api-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(transformPrismaProjectToClient(project))
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
    const body = await request.json()

    // Validate required fields
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    if (body.color !== undefined) {
      updateData.color = body.color
    }
    if (body.jiraKey !== undefined) {
      updateData.jiraKey = body.jiraKey || null
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(transformPrismaProjectToClient(project))
  } catch (error: unknown) {
    // Handle Prisma not found error
    if (error instanceof Object && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error: unknown) {
    // Handle Prisma not found error
    if (error instanceof Object && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
