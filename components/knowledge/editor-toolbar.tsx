"use client"

import { Editor } from '@tiptap/react'
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Minus,
    Link,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    Superscript,
    Subscript,
    Pilcrow,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useState, useRef } from "react"

interface EditorToolbarProps {
    editor: Editor
}

function ToolbarButton({ 
    isActive, 
    onClick, 
    children, 
    title 
}: { 
    isActive?: boolean
    onClick: () => void
    children: React.ReactNode
    title: string
}) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "h-7 w-7 rounded-md transition-all",
                isActive && "bg-primary/20 text-primary"
            )}
            onClick={(e) => {
                e.preventDefault()
                onClick()
            }}
            onMouseDown={(e) => e.preventDefault()}
            title={title}
            type="button"
        >
            {children}
        </Button>
    )
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const toolbarRef = useRef<HTMLDivElement>(null)

    const setLink = useCallback(() => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        }
        setShowLinkInput(false)
        setLinkUrl("")
    }, [editor, linkUrl])

    // Track selection changes to position the toolbar
    useEffect(() => {
        const updateToolbar = () => {
            const { selection } = editor.state
            const { empty } = selection

            if (empty) {
                setIsVisible(false)
                return
            }

            // Get the selection coordinates
            const { ranges } = selection
            const from = Math.min(...ranges.map(range => range.$from.pos))
            const to = Math.max(...ranges.map(range => range.$to.pos))
            
            // Use the editor's DOM to find the selection position
            const editorElement = editor.view.dom
            const editorRect = editorElement.getBoundingClientRect()
            
            const domSelection = window.getSelection()
            if (!domSelection || domSelection.rangeCount === 0) {
                setIsVisible(false)
                return
            }
            
            const range = domSelection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            
            if (rect.width === 0 && rect.height === 0) {
                setIsVisible(false)
                return
            }

            // Position above the selection
            const toolbarWidth = toolbarRef.current?.offsetWidth || 500
            const scrollContainer = editorElement.closest('.overflow-y-auto') || document.documentElement
            
            const top = rect.top + scrollContainer.scrollTop - 48
            const left = Math.max(
                8,
                Math.min(
                    rect.left + rect.width / 2 - toolbarWidth / 2,
                    window.innerWidth - toolbarWidth - 8
                )
            )

            setPosition({ top: rect.top - 48, left })
            setIsVisible(true)
        }

        editor.on('selectionUpdate', updateToolbar)
        editor.on('blur', () => {
            // Delay hiding to allow toolbar button clicks
            setTimeout(() => {
                if (!toolbarRef.current?.contains(document.activeElement)) {
                    setIsVisible(false)
                }
            }, 150)
        })

        return () => {
            editor.off('selectionUpdate', updateToolbar)
        }
    }, [editor])

    if (!isVisible) return null

    return (
        <div
            ref={toolbarRef}
            className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border bg-card/95 backdrop-blur-sm p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {showLinkInput ? (
                <div className="flex items-center gap-1 px-1">
                    <input
                        type="url"
                        placeholder="https://..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setLink()
                            if (e.key === 'Escape') setShowLinkInput(false)
                        }}
                        className="h-7 w-48 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={setLink}>
                        ✓
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowLinkInput(false)}>
                        ✕
                    </Button>
                </div>
            ) : (
                <>
                    {/* Text formatting */}
                    <ToolbarButton isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
                        <Bold className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
                        <Italic className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
                        <Underline className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
                        <Strikethrough className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
                        <Code className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
                        <Highlighter className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript">
                        <Superscript className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript">
                        <Subscript className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Separator orientation="vertical" className="mx-0.5 h-5" />

                    {/* Block types */}
                    <ToolbarButton isActive={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">
                        <Pilcrow className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
                        <Heading1 className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
                        <Heading2 className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
                        <Heading3 className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Separator orientation="vertical" className="mx-0.5 h-5" />

                    {/* Lists */}
                    <ToolbarButton isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
                        <List className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
                        <ListOrdered className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task List">
                        <ListChecks className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
                        <Quote className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Separator orientation="vertical" className="mx-0.5 h-5" />

                    {/* Alignment */}
                    <ToolbarButton isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
                        <AlignLeft className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
                        <AlignCenter className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
                        <AlignRight className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Separator orientation="vertical" className="mx-0.5 h-5" />

                    {/* Insert */}
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                        <Minus className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton 
                        isActive={editor.isActive('link')} 
                        onClick={() => {
                            if (editor.isActive('link')) {
                                editor.chain().focus().unsetLink().run()
                            } else {
                                const previousUrl = editor.getAttributes('link').href
                                setLinkUrl(previousUrl || '')
                                setShowLinkInput(true)
                            }
                        }} 
                        title="Link"
                    >
                        <Link className="w-3.5 h-3.5" />
                    </ToolbarButton>
                </>
            )}
        </div>
    )
}
