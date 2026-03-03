"use client"

import { Editor, Range } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import { Extension } from "@tiptap/core"
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion"
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
    useRef,
} from "react"
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Minus,
    Code,
    MessageSquare,
    Paperclip,
    Layout,
    Pen,
    Image,
    Columns2,
    Columns3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandItem {
    title: string
    description: string
    icon: React.ReactNode
    command: (props: { editor: Editor; range: Range }) => void
    category: string
}

const COMMANDS: CommandItem[] = [
    // Basic blocks
    {
        title: "Text",
        description: "Plain text paragraph",
        icon: <Type className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setParagraph().run()
        },
    },
    {
        title: "Heading 1",
        description: "Large section heading",
        icon: <Heading1 className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
        },
    },
    {
        title: "Heading 2",
        description: "Medium section heading",
        icon: <Heading2 className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
        },
    },
    {
        title: "Heading 3",
        description: "Small section heading",
        icon: <Heading3 className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
        },
    },
    {
        title: "Bullet List",
        description: "Unordered list of items",
        icon: <List className="w-4 h-4" />,
        category: "Lists",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run()
        },
    },
    {
        title: "Numbered List",
        description: "Ordered list with numbers",
        icon: <ListOrdered className="w-4 h-4" />,
        category: "Lists",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run()
        },
    },
    {
        title: "Task List",
        description: "List with checkboxes",
        icon: <ListChecks className="w-4 h-4" />,
        category: "Lists",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run()
        },
    },
    {
        title: "Quote",
        description: "Block quotation",
        icon: <Quote className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run()
        },
    },
    {
        title: "Divider",
        description: "Horizontal line separator",
        icon: <Minus className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run()
        },
    },
    {
        title: "Code Block",
        description: "Code with syntax highlighting",
        icon: <Code className="w-4 h-4" />,
        category: "Basic",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
        },
    },
    // Advanced blocks
    {
        title: "Callout",
        description: "Highlighted info box",
        icon: <MessageSquare className="w-4 h-4" />,
        category: "Advanced",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
                type: 'calloutBlock',
                attrs: { type: 'info', icon: 'ℹ️' },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type something...' }] }],
            }).run()
        },
    },
    {
        title: "File Attachment",
        description: "Upload PDF, Word, Excel...",
        icon: <Paperclip className="w-4 h-4" />,
        category: "Advanced",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run()
            // Trigger file upload
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.onenote,.one,.txt,.csv,.zip,.png,.jpg,.jpeg,.gif,.svg'
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                
                const reader = new FileReader()
                reader.onload = () => {
                    const dataUrl = reader.result as string
                    editor.chain().focus().insertContent({
                        type: 'fileAttachmentBlock',
                        attrs: {
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            dataUrl: dataUrl,
                        },
                    }).run()
                }
                reader.readAsDataURL(file)
            }
            input.click()
        },
    },
    {
        title: "Board Link",
        description: "Link to Excalidraw board",
        icon: <Layout className="w-4 h-4" />,
        category: "Advanced",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
                type: 'boardLinkBlock',
                attrs: { boardId: '', boardName: 'Select a board...', showPicker: true },
            }).run()
        },
    },
    {
        title: "Drawing",
        description: "Excalidraw canvas",
        icon: <Pen className="w-4 h-4" />,
        category: "Advanced",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
                type: 'excalidrawBlock',
                attrs: { data: '{}', expanded: true },
            }).run()
        },
    },
    {
        title: "Image",
        description: "Upload or embed an image",
        icon: <Image className="w-4 h-4" />,
        category: "Advanced",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run()
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                    editor.chain().focus().setImage({ src: reader.result as string }).run()
                }
                reader.readAsDataURL(file)
            }
            input.click()
        },
    },
    // Layout
    {
        title: "2 Columns",
        description: "Side-by-side layout",
        icon: <Columns2 className="w-4 h-4" />,
        category: "Layout",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
                type: 'columns',
                attrs: { count: 2 },
                content: [
                    { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column 1' }] }] },
                    { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column 2' }] }] },
                ],
            }).run()
        },
    },
    {
        title: "3 Columns",
        description: "Three-column layout",
        icon: <Columns3 className="w-4 h-4" />,
        category: "Layout",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
                type: 'columns',
                attrs: { count: 3 },
                content: [
                    { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column 1' }] }] },
                    { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column 2' }] }] },
                    { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column 3' }] }] },
                ],
            }).run()
        },
    },
]

// Command list component rendered in the dropdown
interface CommandListProps {
    items: CommandItem[]
    command: (item: CommandItem) => void
}

export interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0)
        const scrollContainerRef = useRef<HTMLDivElement>(null)

        // Group items by category
        const groupedItems = items.reduce((groups, item) => {
            if (!groups[item.category]) groups[item.category] = []
            groups[item.category].push(item)
            return groups
        }, {} as Record<string, CommandItem[]>)

        const selectItem = useCallback(
            (index: number) => {
                const item = items[index]
                if (item) command(item)
            },
            [items, command]
        )

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === "ArrowUp") {
                    setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
                    return true
                }
                if (event.key === "ArrowDown") {
                    setSelectedIndex((prev) => (prev + 1) % items.length)
                    return true
                }
                if (event.key === "Enter") {
                    selectItem(selectedIndex)
                    return true
                }
                return false
            },
        }))

        useEffect(() => {
            setSelectedIndex(0)
        }, [items])

        // Scroll selected item into view
        useEffect(() => {
            const container = scrollContainerRef.current
            if (!container) return
            const selectedEl = container.querySelector(`[data-index="${selectedIndex}"]`)
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' })
            }
        }, [selectedIndex])

        if (items.length === 0) {
            return (
                <div className="slash-command-menu p-3 text-sm text-muted-foreground">
                    No results found
                </div>
            )
        }

        let flatIndex = 0

        return (
            <div
                ref={scrollContainerRef}
                className="slash-command-menu w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2"
            >
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                            {category}
                        </div>
                        {categoryItems.map((item) => {
                            const currentIndex = flatIndex++
                            return (
                                <button
                                    key={item.title}
                                    data-index={currentIndex}
                                    className={cn(
                                        "flex items-center gap-3 w-full rounded-lg px-2 py-2 text-left transition-colors",
                                        currentIndex === selectedIndex
                                            ? "bg-primary/10 text-foreground"
                                            : "text-foreground/80 hover:bg-muted"
                                    )}
                                    onClick={() => selectItem(currentIndex)}
                                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                                        currentIndex === selectedIndex
                                            ? "border-primary/30 bg-primary/5 text-primary"
                                            : "border-border bg-muted/50 text-muted-foreground"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">{item.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {item.description}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }
)

CommandList.displayName = "CommandList"

// Pure DOM-based popup rendering (no tippy.js needed)
const renderSuggestion = (): Omit<SuggestionOptions<CommandItem>['render'], never> => {
    let component: ReactRenderer | null = null
    let popup: HTMLElement | null = null

    return {
        onStart: (props) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            })

            // Create a wrapper element positioned absolutely
            popup = document.createElement('div')
            popup.style.position = 'absolute'
            popup.style.zIndex = '50'
            popup.style.left = '0'
            popup.style.top = '0'
            popup.style.willChange = 'transform'
            
            if (component.element) {
                popup.appendChild(component.element)
            }
            document.body.appendChild(popup)

            // Position based on cursor
            const clientRect = props.clientRect?.()
            if (clientRect) {
                popup.style.transform = `translate(${clientRect.left}px, ${clientRect.bottom + 8}px)`
            }
        },
        onUpdate: (props) => {
            component?.updateProps(props)
            const clientRect = props.clientRect?.()
            if (clientRect && popup) {
                popup.style.transform = `translate(${clientRect.left}px, ${clientRect.bottom + 8}px)`
            }
        },
        onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
                popup?.remove()
                popup = null
                component?.destroy()
                component = null
                return true
            }
            return (component?.ref as any)?.onKeyDown(props) ?? false
        },
        onExit: () => {
            popup?.remove()
            popup = null
            component?.destroy()
            component = null
        },
    }
}

// The TipTap extension
export const SlashCommands = Extension.create({
    name: 'slashCommands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: Editor
                    range: Range
                    props: CommandItem
                }) => {
                    props.command({ editor, range })
                },
                items: ({ query }: { query: string }) => {
                    return COMMANDS.filter((item) =>
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    )
                },
                render: renderSuggestion,
            } as Partial<SuggestionOptions<CommandItem>>,
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})
