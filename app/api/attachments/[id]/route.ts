import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transformPrismaAttachmentToClient } from '@/lib/api-types'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachment = await (prisma as any).taskAttachment.findUnique({
      where: { id: params.id },
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transformPrismaAttachmentToClient(attachment as any))
  } catch (error) {
    console.error('Failed to fetch attachment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify attachment exists
    const attachment = await (prisma as any).taskAttachment.findUnique({
      where: { id: params.id },
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    await (prisma as any).taskAttachment.delete({
      where: { id: params.id },
    })

    // Auto-generate Activity record
    await (prisma as any).activity.create({
      data: {
        taskId: attachment.taskId,
        type: 'attachment_deleted',
        description: `Attachment deleted: ${attachment.fileName}`,
        metadata: JSON.stringify({ attachmentId: params.id, fileName: attachment.fileName }),
      },
    })

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
