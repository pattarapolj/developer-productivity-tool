"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToolingTrackerStore } from "@/lib/store"
import { DocEditor } from "@/components/knowledge/doc-editor"
import { EmojiPicker } from "@/components/knowledge/emoji-picker"
import { CoverPicker } from "@/components/knowledge/cover-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    ChevronLeft, 
    Loader2, 
    Image as ImageIcon, 
    Smile, 
    MoreHorizontal,
    Star,
    Trash2,
    Copy,
    Maximize2,
    Minimize2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

export default function DocPage() {
    const params = useParams()
    const router = useRouter()
    const { docs, updateDoc, deleteDoc, addDoc, isLoading } = useToolingTrackerStore()
    
    const docId = params.docId as string
    const doc = docs.find(d => d.id === docId)
    
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [icon, setIcon] = useState<string | null>(null)
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [isSaving, setSaving] = useState(false)
    const [fullWidth, setFullWidth] = useState(true)
    const isMounted = useRef(false)

    // Initialize state from doc
    useEffect(() => {
        if (doc && !isMounted.current) {
            setTitle(doc.title)
            setContent(doc.content)
            setIcon(doc.icon)
            setCoverImage(doc.coverImage)
            setIsFavorite(doc.isFavorite)
            setFullWidth(doc.fullWidth)
            isMounted.current = true
        }
    }, [doc])

    const debouncedContent = useDebounce(content, 500)
    const debouncedTitle = useDebounce(title, 500)

    // Auto-save effect
    useEffect(() => {
        if (!isMounted.current || !doc) return

        const save = async () => {
            setSaving(true)
            try {
                await updateDoc(docId, { 
                    title: debouncedTitle, 
                    content: debouncedContent 
                })
            } finally {
                setSaving(false)
            }
        }

        if (debouncedContent !== doc.content || debouncedTitle !== doc.title) {
            save()
        }
    }, [debouncedContent, debouncedTitle, docId, updateDoc, doc])

    const handleIconChange = async (emoji: string) => {
        setIcon(emoji || null)
        await updateDoc(docId, { icon: emoji || null })
    }

    const handleCoverChange = async (cover: string | null) => {
        setCoverImage(cover)
        await updateDoc(docId, { coverImage: cover })
    }

    const handleToggleFavorite = async () => {
        const newVal = !isFavorite
        setIsFavorite(newVal)
        await updateDoc(docId, { isFavorite: newVal })
    }

    const handleDuplicate = async () => {
        if (!doc) return
        const newDoc = await addDoc({
            title: `${doc.title} (Copy)`,
            content: doc.content,
            icon: doc.icon,
            coverImage: doc.coverImage,
            fullWidth: doc.fullWidth,
            isArchived: false,
            isFavorite: false,
            parentId: doc.parentId,
            projectId: doc.projectId,
        })
        if (newDoc) {
            router.push(`/knowledge/doc/${newDoc.id}`)
        }
    }

    const handleDelete = async () => {
        await deleteDoc(docId)
        router.push("/knowledge")
    }

    if (isLoading && !doc) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!doc) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="text-5xl">📄</div>
                <h1 className="text-2xl font-bold">Document not found</h1>
                <p className="text-muted-foreground">This document may have been moved or deleted.</p>
                <Button onClick={() => router.push("/knowledge")}>Go Back</Button>
            </div>
        )
    }

    // Determine cover type
    const isColor = coverImage?.startsWith("#") || coverImage?.startsWith("rgb")
    const isGradient = coverImage?.startsWith("linear-gradient")
    const isImage = coverImage && !isColor && !isGradient

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/knowledge")}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => router.push("/knowledge")}>
                            Knowledge
                        </span>
                        <span>/</span>
                        <span className="text-foreground font-medium truncate max-w-[200px]">{title || "Untitled"}</span>
                    </div>
                    {isSaving && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={handleToggleFavorite}
                    >
                        <Star className={cn("w-4 h-4", isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                            setFullWidth(!fullWidth)
                            updateDoc(docId, { fullWidth: !fullWidth })
                        }}
                        title={fullWidth ? "Narrow width" : "Full width"}
                    >
                        {fullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDuplicate}>
                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Cover Image */}
                {coverImage ? (
                    <div 
                        className="h-52 w-full relative group"
                        style={{
                            backgroundColor: isColor ? coverImage : undefined,
                            backgroundImage: isGradient ? coverImage : (isImage ? `url(${coverImage})` : undefined),
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CoverPicker value={coverImage} onChange={handleCoverChange}>
                                <Button variant="secondary" size="sm" className="h-7 text-xs shadow-lg">
                                    <ImageIcon className="w-3 h-3 mr-1.5" />
                                    Change Cover
                                </Button>
                            </CoverPicker>
                        </div>
                    </div>
                ) : null}

                <div className={cn(
                    "mx-auto px-8 pb-24",
                    fullWidth ? "max-w-4xl" : "max-w-2xl",
                    coverImage ? "pt-8" : "pt-16"
                )}>
                    {/* Icon + Action bar */}
                    <div className="flex items-start gap-3 mb-4">
                        {icon ? (
                            <EmojiPicker value={icon} onChange={handleIconChange}>
                                <button className="text-5xl hover:scale-105 transition-transform cursor-pointer -mt-1">
                                    {icon}
                                </button>
                            </EmojiPicker>
                        ) : null}
                        
                        {/* Hover actions: Add Icon, Add Cover */}
                        <div className="flex gap-1 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                            {!icon && (
                                <EmojiPicker value={icon} onChange={handleIconChange}>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                                        <Smile className="w-3.5 h-3.5 mr-1" />
                                        Add Icon
                                    </Button>
                                </EmojiPicker>
                            )}
                            {!coverImage && (
                                <CoverPicker value={coverImage} onChange={handleCoverChange}>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                                        <ImageIcon className="w-3.5 h-3.5 mr-1" />
                                        Add Cover
                                    </Button>
                                </CoverPicker>
                            )}
                        </div>
                    </div>

                    {/* Title Input */}
                    <div className="mb-6">
                        <Input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)}
                            className="text-4xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 bg-transparent"
                            placeholder="Untitled"
                        />
                    </div>

                    {/* Editor */}
                    <DocEditor 
                        content={content} 
                        onChange={setContent} 
                    />
                </div>
            </div>
        </div>
    )
}
