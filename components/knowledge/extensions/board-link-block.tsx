"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Layout, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToolingTrackerStore } from "@/lib/store"
import { useState, useEffect } from "react"
import Link from "next/link"

function BoardPickerDropdown({ onSelect, onClose }: { onSelect: (boardId: string, boardName: string) => void; onClose: () => void }) {
    const { boards } = useToolingTrackerStore()
    const [search, setSearch] = useState("")

    const activeBoards = boards.filter(b => !b.isArchived)
    const filteredBoards = activeBoards.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="absolute top-full left-0 z-50 mt-1 w-72 rounded-xl border border-border bg-card shadow-xl p-2 animate-in fade-in-0 slide-in-from-top-2">
            <input
                type="text"
                placeholder="Search boards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
                {filteredBoards.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        {activeBoards.length === 0 ? "No boards found. Create one in Whiteboards first!" : "No matching boards"}
                    </div>
                ) : (
                    filteredBoards.map((board) => (
                        <button
                            key={board.id}
                            className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left hover:bg-muted transition-colors"
                            onClick={() => onSelect(board.id, board.name)}
                        >
                            <div className="w-8 h-8 rounded-md bg-muted/50 border border-border flex items-center justify-center shrink-0">
                                <Layout className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{board.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    Updated {new Date(board.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
            <div className="border-t border-border mt-1 pt-1">
                <button 
                    className="w-full text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

function BoardLinkComponent({ node, updateAttributes, deleteNode }: any) {
    const { boardId, boardName, showPicker } = node.attrs
    const [pickerOpen, setPickerOpen] = useState(showPicker || false)

    const handleSelect = (id: string, name: string) => {
        updateAttributes({ boardId: id, boardName: name, showPicker: false })
        setPickerOpen(false)
    }

    if (!boardId && !pickerOpen) {
        return (
            <NodeViewWrapper className="my-3">
                <div 
                    contentEditable={false}
                    className="relative flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setPickerOpen(true)}
                >
                    <Layout className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to select a board...</span>
                </div>
            </NodeViewWrapper>
        )
    }

    return (
        <NodeViewWrapper className="my-3">
            <div contentEditable={false} className="relative">
                {pickerOpen ? (
                    <div className="relative">
                        <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                            <Layout className="w-5 h-5 text-primary" />
                            <span className="text-sm text-primary">Select a board:</span>
                        </div>
                        <BoardPickerDropdown 
                            onSelect={handleSelect} 
                            onClose={() => {
                                setPickerOpen(false)
                                if (!boardId) deleteNode()
                            }}
                        />
                    </div>
                ) : (
                    <div className="board-link-block group flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 hover:bg-card hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                            <Layout className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{boardName || "Linked Board"}</div>
                            <div className="text-xs text-muted-foreground">Excalidraw Whiteboard</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/whiteboards/${boardId}`} target="_blank">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Open Board">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setPickerOpen(true)}
                                title="Change Board"
                            >
                                <Layout className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteNode()}
                                title="Remove"
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    )
}

export const BoardLinkBlock = Node.create({
    name: "boardLinkBlock",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            boardId: { default: "" },
            boardName: { default: "" },
            showPicker: { default: false },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-board-link]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-board-link": "" }),
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(BoardLinkComponent)
    },
})
