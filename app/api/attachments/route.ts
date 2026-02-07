import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaAttachmentToClient } from '@/lib/api-types'
import type { CreateAttachmentRequest } from '@/lib/api-types'

export async function GET(request?: NextRequest) {
  try {
    const url = new URL(request?.url || 'http://localhost:3000')
    const taskId = url.searchParams.get('taskId')

    const where = taskId ? { taskId } : {}

    const attachments = await (prisma as any).taskAttachment.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(attachments.map(transformPrismaAttachmentToClient))
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAttachmentRequest = await request.json()

    // Validate required fields
    if (!body.taskId?.trim()) {
      return NextResponse.json(
        { error: 'Task ID (taskId) is required' },
        { status: 400 }
      )
    }

    if (!body.fileName?.trim()) {
      return NextResponse.json(
        { error: 'File name (fileName) is required' },
        { status: 400 }
      )
    }

    if (!body.fileType?.trim()) {
      return NextResponse.json(
        { error: 'File type (fileType) is required' },
        { status: 400 }
      )
    }

    if (!body.dataUrl?.trim()) {
      return NextResponse.json(
        { error: 'Data URL (dataUrl) is required' },
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

    // Calculate file size from base64 string
    const fileSize = Math.ceil((body.dataUrl.length * 3) / 4)

    // Create attachment
    const attachment = await (prisma as any).taskAttachment.create({
      data: {
        taskId: body.taskId,
        fileName: body.fileName.trim(),
        fileSize,
        fileType: body.fileType.trim(),
        dataUrl: body.dataUrl,
      },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: body.taskId,
        projectId: task.projectId,
        type: 'attachment_added',
        description: `Attachment added: ${body.fileName.trim()}`,
        metadata: JSON.stringify({ attachmentId: attachment.id, fileName: body.fileName.trim() }),
      },
    })

    return NextResponse.json(transformPrismaAttachmentToClient(attachment as any), { status: 201 })
  } catch (error) {
    console.error('Failed to create attachment:', error)
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    )
  }
}
