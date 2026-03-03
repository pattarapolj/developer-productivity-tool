"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Maximize2, Minimize2, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
    () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-2">Loading canvas...</div>
                    <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto" />
                </div>
            </div>
        ),
    }
)

function ExcalidrawComponent({ node, updateAttributes, deleteNode }: any) {
    const [expanded, setExpanded] = useState(node.attrs.expanded ?? true)
    const [mounted, setMounted] = useState(false)
    const [height, setHeight] = useState(node.attrs.height || 400)
    const excalidrawAPIRef = useRef<any>(null)
    const isResizing = useRef(false)
    const startY = useRef(0)
    const startHeight = useRef(0)

    const initialData = useMemo(() => {
        try {
            const parsed = JSON.parse(node.attrs.data || '{}')
            return {
                elements: parsed.elements || [],
                appState: { ...parsed.appState, collaborators: new Map() },
            }
        } catch {
            return { elements: [], appState: { collaborators: new Map() } }
        }
    }, []) // Only parse on initial mount

    useEffect(() => {
        queueMicrotask(() => setMounted(true))
    }, [])

    const handleChange = useCallback(
        (elements: readonly any[], appState: any) => {
            try {
                const { collaborators, ...cleanAppState } = appState
                const data = JSON.stringify({
                    elements: [...elements],
                    appState: cleanAppState,
                })
                updateAttributes({ data })
            } catch (error) {
                console.error("Failed to serialize Excalidraw state:", error)
            }
        },
        [updateAttributes]
    )

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isResizing.current = true
        startY.current = e.clientY
        startHeight.current = height

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return
            const delta = e.clientY - startY.current
            const newHeight = Math.max(200, Math.min(800, startHeight.current + delta))
            setHeight(newHeight)
        }

        const handleMouseUp = () => {
            isResizing.current = false
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            updateAttributes({ height })
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [height, updateAttributes])

    return (
        <NodeViewWrapper className="my-4">
            <div contentEditable={false} className="excalidraw-embed group relative rounded-xl border border-border overflow-hidden bg-card/50">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>🎨</span>
                        <span className="font-medium">Drawing</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                                setExpanded(!expanded)
                                updateAttributes({ expanded: !expanded })
                            }}
                            title={expanded ? "Collapse" : "Expand"}
                        >
                            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => deleteNode()}
                            title="Remove"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Canvas */}
                {expanded && mounted ? (
                    <>
                        <div style={{ height: `${height}px` }} className="w-full">
                            <Excalidraw
                                initialData={initialData}
                                onChange={handleChange}
                                theme="dark"
                                renderTopRightUI={() => null}
                                excalidrawAPI={(api: any) => {
                                    excalidrawAPIRef.current = api
                                }}
                            />
                        </div>
                        {/* Resize handle */}
                        <div
                            className="h-2 cursor-ns-resize bg-muted/30 hover:bg-primary/20 transition-colors flex items-center justify-center"
                            onMouseDown={handleResizeStart}
                        >
                            <GripVertical className="w-4 h-3 text-muted-foreground rotate-90" />
                        </div>
                    </>
                ) : !expanded ? (
                    <div 
                        className="h-16 flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => {
                            setExpanded(true)
                            updateAttributes({ expanded: true })
                        }}
                    >
                        Click to expand drawing canvas
                    </div>
                ) : null}
            </div>
        </NodeViewWrapper>
    )
}

export const ExcalidrawBlock = Node.create({
    name: "excalidrawBlock",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            data: { default: "{}" },
            expanded: { default: true },
            height: { default: 400 },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-excalidraw-embed]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-excalidraw-embed": "" }),
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ExcalidrawComponent)
    },
})
