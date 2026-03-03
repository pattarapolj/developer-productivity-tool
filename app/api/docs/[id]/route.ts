import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const doc = await prisma.doc.findUnique({
      where: { id },
      include: { children: true, parent: true }
    })
    if (!doc) {
      return NextResponse.json({ error: "Doc not found" }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Failed to fetch doc:", error)
    return NextResponse.json({ error: "Failed to fetch doc" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate fields if necessary
    // Remove ID/dates from body to prevent overwrite if passed
    const { id: _, createdAt, updatedAt, ...updates } = body

    const doc = await prisma.doc.update({
      where: { id },
      data: updates
    })
    return NextResponse.json(doc)
  } catch (error) {
    console.error("Failed to update doc:", error)
    return NextResponse.json({ error: "Failed to update doc" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.doc.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete doc:", error)
    return NextResponse.json({ error: "Failed to delete doc" }, { status: 500 })
  }
}
