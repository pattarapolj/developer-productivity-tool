"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Smile } from "lucide-react"

const EMOJI_CATEGORIES = {
    "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😎", "🤩", "🥳", "😤", "🤔", "🤗", "🤫"],
    "Objects": ["📄", "📝", "📋", "📌", "📎", "📁", "📂", "📚", "📖", "📓", "📒", "📕", "📗", "📘", "📙", "🗂️", "📊", "📈", "📉", "🗄️", "💼", "🗑️"],
    "Tech": ["💻", "🖥️", "⌨️", "🖱️", "🔧", "🔨", "⚙️", "🛠️", "🔩", "🔌", "💡", "🔋", "📡", "🧪", "🔬", "🧲", "🧰", "📱", "🖨️", "💾", "💿", "🔑"],
    "Nature": ["🌱", "🌿", "☘️", "🍀", "🌲", "🌳", "🌴", "🌵", "🌾", "🌻", "🌺", "🌹", "🌸", "💐", "🍄", "🍃", "🍂", "🍁", "🦋", "🐛", "🐝", "🌈"],
    "Symbols": ["✅", "❌", "⭐", "🌟", "💫", "⚡", "🔥", "💥", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💎", "🏆", "🎯", "🚀", "🎨", "🎭"],
    "Food": ["🍕", "🍔", "🌮", "🍣", "🍜", "🍰", "🧁", "🍩", "🍪", "☕", "🍵", "🧃", "🥤", "🍺", "🍷", "🧇", "🥞", "🍳", "🥗", "🍿", "🧈", "🥚"],
}

interface EmojiPickerProps {
    value: string | null
    onChange: (emoji: string) => void
    children?: React.ReactNode
}

export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false)

    const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
    const filteredCategories = search
        ? { "Results": allEmojis.filter(e => e.includes(search)) }
        : EMOJI_CATEGORIES

    const handleSelect = useCallback((emoji: string) => {
        onChange(emoji)
        setOpen(false)
    }, [onChange])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <span className="text-lg">{value || "📄"}</span>
                        <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
                <Input
                    placeholder="Search emoji..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-sm mb-2"
                />
                <div className="max-h-56 overflow-y-auto">
                    {Object.entries(filteredCategories).map(([category, emojis]) => (
                        <div key={category}>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-1 py-1">
                                {category}
                            </div>
                            <div className="grid grid-cols-8 gap-0.5">
                                {(emojis as string[]).map((emoji) => (
                                    <button
                                        key={emoji}
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-md text-lg hover:bg-muted transition-colors",
                                            value === emoji && "bg-primary/10 ring-1 ring-primary/30"
                                        )}
                                        onClick={() => handleSelect(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {value && (
                    <div className="border-t border-border mt-2 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => {
                                onChange("")
                                setOpen(false)
                            }}
                        >
                            Remove icon
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
