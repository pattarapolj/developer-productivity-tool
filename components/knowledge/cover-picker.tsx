"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Image as ImageIcon, Upload, X } from "lucide-react"

const PRESET_COVERS = [
    // Gradients
    { id: "gradient-1", type: "gradient" as const, value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "Purple Dream" },
    { id: "gradient-2", type: "gradient" as const, value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "Pink Sunset" },
    { id: "gradient-3", type: "gradient" as const, value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", label: "Ocean Blue" },
    { id: "gradient-4", type: "gradient" as const, value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "Fresh Mint" },
    { id: "gradient-5", type: "gradient" as const, value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", label: "Warm Glow" },
    { id: "gradient-6", type: "gradient" as const, value: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", label: "Lavender" },
    { id: "gradient-7", type: "gradient" as const, value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", label: "Peach" },
    { id: "gradient-8", type: "gradient" as const, value: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", label: "Sky Blue" },
    { id: "gradient-9", type: "gradient" as const, value: "linear-gradient(135deg, #667eea 0%, #f093fb 50%, #fa709a 100%)", label: "Rainbow" },
    { id: "gradient-10", type: "gradient" as const, value: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)", label: "Dark Space" },
    { id: "gradient-11", type: "gradient" as const, value: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)", label: "Forest" },
    { id: "gradient-12", type: "gradient" as const, value: "linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)", label: "Wine" },
    // Solid colors
    { id: "solid-1", type: "solid" as const, value: "#1a1a2e", label: "Navy" },
    { id: "solid-2", type: "solid" as const, value: "#16213e", label: "Deep Blue" },
    { id: "solid-3", type: "solid" as const, value: "#0f3460", label: "Royal Blue" },
    { id: "solid-4", type: "solid" as const, value: "#533483", label: "Purple" },
    { id: "solid-5", type: "solid" as const, value: "#e94560", label: "Rose" },
    { id: "solid-6", type: "solid" as const, value: "#1b4332", label: "Forest Green" },
]

interface CoverPickerProps {
    value: string | null
    onChange: (cover: string | null) => void
    children?: React.ReactNode
}

export function CoverPicker({ value, onChange, children }: CoverPickerProps) {
    const [open, setOpen] = useState(false)

    const handleFileUpload = useCallback(() => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
                onChange(reader.result as string)
                setOpen(false)
            }
            reader.readAsDataURL(file)
        }
        input.click()
    }, [onChange])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ImageIcon className="w-4 h-4" />
                        {value ? "Change Cover" : "Add Cover"}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Cover Image</h4>
                    {value && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => {
                                onChange(null)
                                setOpen(false)
                            }}
                        >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                        </Button>
                    )}
                </div>

                {/* Upload button */}
                <Button
                    variant="outline"
                    className="w-full mb-3 h-9 text-sm"
                    onClick={handleFileUpload}
                >
                    <Upload className="w-3.5 h-3.5 mr-2" />
                    Upload Image
                </Button>

                {/* Preset grid */}
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                    Presets
                </div>
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {PRESET_COVERS.map((cover) => (
                        <button
                            key={cover.id}
                            className={cn(
                                "h-12 rounded-lg transition-all border-2",
                                value === cover.value ? "border-primary scale-95" : "border-transparent hover:border-border hover:scale-95"
                            )}
                            style={{ 
                                background: cover.type === "gradient" ? cover.value : cover.value,
                            }}
                            onClick={() => {
                                onChange(cover.value)
                                setOpen(false)
                            }}
                            title={cover.label}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
