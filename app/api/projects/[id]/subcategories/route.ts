import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaProjectToClient } from '@/lib/api-types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate required field
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Subcategory name is required' },
        { status: 400 }
      )
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Parse existing subcategories
    const subcategories = JSON.parse(project.subcategories) as string[]

    // Check for duplicate
    const exists = subcategories.some(
      (sub) => sub.toLowerCase() === body.name.trim().toLowerCase()
    )

    // If duplicate, return the unchanged project
    if (exists) {
      return NextResponse.json(transformPrismaProjectToClient(project))
    }

    // Add new subcategory
    const updated = [...subcategories, body.name.trim()]

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        subcategories: JSON.stringify(updated)
      }
    })

    return NextResponse.json(transformPrismaProjectToClient(updatedProject))
  } catch (error) {
    console.error('Failed to add subcategory:', error)
    return NextResponse.json(
      { error: 'Failed to add subcategory' },
      { status: 500 }
    )
  }
}
