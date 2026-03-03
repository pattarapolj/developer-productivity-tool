"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { useEffect } from 'react'

// Custom extensions
import { CalloutBlock } from './extensions/callout-block'
import { FileAttachmentBlock } from './extensions/file-attachment-block'
import { BoardLinkBlock } from './extensions/board-link-block'
import { ExcalidrawBlock } from './extensions/excalidraw-block'
import { DragHandle } from './extensions/drag-handle'
import { Columns, Column } from './extensions/columns-block'
import { SlashCommands } from './slash-command-menu'
import { EditorToolbar } from './editor-toolbar'

interface DocEditorProps {
    content: string
    editable?: boolean
    onChange?: (content: string) => void
}

export function DocEditor({ content, editable = true, onChange }: DocEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: {
                    HTMLAttributes: {
                        class: 'rounded-lg bg-muted/50 border border-border p-4 font-mono text-sm my-4 overflow-x-auto',
                    },
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4',
                },
            }),
            TaskList.configure({
                HTMLAttributes: { class: 'not-prose' },
            }),
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return `Heading ${node.attrs.level}`
                    }
                    return 'Type "/" for commands...'
                },
                emptyEditorClass: 'is-editor-empty',
            }),
            Underline,
            TiptapLink.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-primary underline underline-offset-4 hover:text-primary/80 transition-colors cursor-pointer',
                },
            }),
            Highlight.configure({
                multicolor: false,
                HTMLAttributes: {
                    class: 'bg-primary/20 rounded px-0.5',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Typography,
            TextStyle,
            Color,
            Superscript,
            Subscript,
            // Custom blocks
            CalloutBlock,
            FileAttachmentBlock,
            BoardLinkBlock,
            ExcalidrawBlock,
            // Multi-column layout
            Columns,
            Column,
            // Drag handle
            DragHandle,
            // Slash commands
            SlashCommands,
        ],
        content: content ? JSON.parse(content) : undefined,
        editable,
        onUpdate: ({ editor }) => {
            onChange?.(JSON.stringify(editor.getJSON()))
        },
        editorProps: {
            attributes: {
                class: 'notion-editor prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-0 py-4',
            },
            handleDrop: (view, event, slice, moved) => {
                // Handle file drops
                if (!moved && event.dataTransfer?.files?.length) {
                    const file = event.dataTransfer.files[0]
                    if (!file) return false
                    
                    event.preventDefault()
                    
                    if (file.type.startsWith('image/')) {
                        // Handle image drop
                        const reader = new FileReader()
                        reader.onload = () => {
                            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
                            if (pos) {
                                editor?.chain().focus().setImage({ src: reader.result as string }).run()
                            }
                        }
                        reader.readAsDataURL(file)
                    } else {
                        // Handle file drop
                        const reader = new FileReader()
                        reader.onload = () => {
                            editor?.chain().focus().insertContent({
                                type: 'fileAttachmentBlock',
                                attrs: {
                                    fileName: file.name,
                                    fileSize: file.size,
                                    fileType: file.type,
                                    dataUrl: reader.result as string,
                                },
                            }).run()
                        }
                        reader.readAsDataURL(file)
                    }
                    return true
                }
                return false
            },
        },
        immediatelyRender: false,
    })
    
    // Cleanup
    useEffect(() => {
        return () => {
            editor?.destroy()
        }
    }, [editor])

    if (!editor) return null

    return (
        <div className="w-full editor-container">
            {editable && <EditorToolbar editor={editor} />}
            <EditorContent editor={editor} className="min-h-full" />
        </div>
    )
}
