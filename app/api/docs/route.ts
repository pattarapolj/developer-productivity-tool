import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const parentId = searchParams.get("parentId")
    
    const where: any = { isArchived: false }
    if (projectId) where.projectId = projectId
    // If parentId is explicitly null (string 'null'), fetch root docs
    // If parentId is missing, don't filter by parentId.
    // Let's just filter if provided.
    if (parentId !== null) {
      where.parentId = parentId === "null" ? null : parentId
    }
    
    const docs = await prisma.doc.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        children: {
            select: { id: true, title: true, icon: true }
        }
      }
    })
    return NextResponse.json(docs)
  } catch (error) {
    console.error("Failed to fetch docs:", error)
    return NextResponse.json(
      { error: "Failed to fetch docs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, icon, coverImage, parentId, projectId } = body

    const doc = await prisma.doc.create({
      data: {
        title: title || "Untitled",
        content: content || "",
        icon,
        coverImage,
        parentId,
        projectId
      },
    })
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Failed to create doc:", error)
    return NextResponse.json(
      { error: "Failed to create doc" },
      { status: 500 }
    )
  }
}
