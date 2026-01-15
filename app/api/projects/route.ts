import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaProjectToClient } from '@/lib/api-types'

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(projects.map(transformPrismaProjectToClient))
    } catch (error) {
        console.error('Failed to fetch projects:', error)
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.name?.trim()) {
            return NextResponse.json(
                { error: 'Project name is required' },
                { status: 400 }
            )
        }

        // Create in database
        const project = await prisma.project.create({
            data: {
                name: body.name.trim(),
                color: body.color,
                jiraKey: body.jiraKey || null,
                subcategories: JSON.stringify([])
            }
        })

        return NextResponse.json(transformPrismaProjectToClient(project), { status: 201 })
    } catch (error) {
        console.error('Failed to create project:', error)
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        )
    }
}
