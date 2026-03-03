"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MoreHorizontal, Trash2, Star, FileText } from "lucide-react"
import { Doc } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DocCardProps {
    doc: Doc
    onDelete?: (id: string) => void
    onToggleFavorite?: (id: string) => void
}

const PASTEL_COLORS = [
    "bg-red-100/50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20",
    "bg-orange-100/50 dark:bg-orange-900/10 hover:bg-orange-100/80 dark:hover:bg-orange-900/20",
    "bg-amber-100/50 dark:bg-amber-900/10 hover:bg-amber-100/80 dark:hover:bg-amber-900/20",
    "bg-yellow-100/50 dark:bg-yellow-900/10 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/20",
    "bg-lime-100/50 dark:bg-lime-900/10 hover:bg-lime-100/80 dark:hover:bg-lime-900/20",
    "bg-green-100/50 dark:bg-green-900/10 hover:bg-green-100/80 dark:hover:bg-green-900/20",
    "bg-emerald-100/50 dark:bg-emerald-900/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/20",
    "bg-teal-100/50 dark:bg-teal-900/10 hover:bg-teal-100/80 dark:hover:bg-teal-900/20",
    "bg-cyan-100/50 dark:bg-cyan-900/10 hover:bg-cyan-100/80 dark:hover:bg-cyan-900/20",
    "bg-sky-100/50 dark:bg-sky-900/10 hover:bg-sky-100/80 dark:hover:bg-sky-900/20",
    "bg-blue-100/50 dark:bg-blue-900/10 hover:bg-blue-100/80 dark:hover:bg-blue-900/20",
    "bg-indigo-100/50 dark:bg-indigo-900/10 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/20",
    "bg-violet-100/50 dark:bg-violet-900/10 hover:bg-violet-100/80 dark:hover:bg-violet-900/20",
    "bg-purple-100/50 dark:bg-purple-900/10 hover:bg-purple-100/80 dark:hover:bg-purple-900/20",
    "bg-fuchsia-100/50 dark:bg-fuchsia-900/10 hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-900/20",
    "bg-pink-100/50 dark:bg-pink-900/10 hover:bg-pink-100/80 dark:hover:bg-pink-900/20",
    "bg-rose-100/50 dark:bg-rose-900/10 hover:bg-rose-100/80 dark:hover:bg-rose-900/20",
    "bg-stone-100/50 dark:bg-stone-900/10 hover:bg-stone-100/80 dark:hover:bg-stone-900/20",
]

function getDocColor(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % PASTEL_COLORS.length
    return PASTEL_COLORS[index]
}

function getDocPreview(content: string): string {
    if (!content) return "No content"
    try {
        const json = JSON.parse(content)
        const textNodes: string[] = []
        
        const extractText = (node: any) => {
            if (node.text) textNodes.push(node.text)
            if (node.content) node.content.forEach(extractText)
        }
        
        if (json.content) json.content.forEach(extractText)
        
        const text = textNodes.join(" ")
        return text.slice(0, 120) + (text.length > 120 ? "..." : "") || "Empty document"
    } catch {
        return "No content"
    }
}

export function DocCard({ doc, onDelete, onToggleFavorite }: DocCardProps) {
    const colorClass = getDocColor(doc.id)
    const preview = getDocPreview(doc.content)

    return (
        <Link href={`/knowledge/doc/${doc.id}`}>
            <div className={cn(
                "group relative flex flex-col h-48 rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden",
                colorClass
            )}>
                {/* Header: Icon + Title */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl pt-0.5">
                        {doc.icon || "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate text-foreground/90">
                            {doc.title || "Untitled"}
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mt-1 tracking-wider">
                            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </p>
                    </div>
                    
                    {/* Favorite Star (visible if favorite or hover) */}
                    <div className={cn(
                        "transition-opacity duration-200",
                        doc.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                            onClick={(e) => {
                                e.preventDefault(); e.stopPropagation()
                                onToggleFavorite?.(doc.id)
                            }}
                        >
                            <Star className={cn("w-4 h-4", doc.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/70")} />
                        </Button>
                    </div>
                </div>

                {/* Content Preview */}
                <div className="flex-1 relative">
                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                        {preview}
                    </p>
                    {/* Fade overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/0 to-transparent dark:from-black/0" />
                </div>

                {/* Actions (Menu) - Only on hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                            >
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground/70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => { e.stopPropagation(); onDelete?.(doc.id) }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Link>
    )
}
