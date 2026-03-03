"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToolingTrackerStore } from "@/lib/store"
import { 
    Plus, 
    LayoutGrid, 
    Calendar, 
    CheckSquare, 
    Star, 
    Settings, 
    ChevronDown,
    Folder,
    Hash
} from "lucide-react"

export function KnowledgeSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { addDoc } = useToolingTrackerStore()

    const handleCreateDoc = async () => {
        const newDoc = await addDoc({
            title: "Untitled",
            content: "",
            icon: null,
            coverImage: null,
            fullWidth: true,
            isArchived: false,
            isFavorite: false,
            parentId: null,
            projectId: null
        })
        if (newDoc) {
            router.push(`/knowledge/doc/${newDoc.id}`)
        }
    }

    const navItems = [
        { icon: LayoutGrid, label: "All Docs", href: "/knowledge", active: pathname === "/knowledge" },
        { icon: CheckSquare, label: "Tasks", href: "/tasks", active: pathname?.startsWith("/tasks") },
        { icon: Calendar, label: "Calendar", href: "/calendar", active: pathname?.startsWith("/calendar") },
        { icon: Star, label: "Starred", href: "/knowledge?view=favorites", active: false },
    ]

    return (
        <div className="w-[240px] flex flex-col h-full bg-muted/30 border-r border-border/50 p-3 gap-4 hidden md:flex">
            {/* Header / User */}
            <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    JS
                </div>
                <span className="text-sm font-medium">Joe's Space</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto" />
            </div>

            {/* New Doc Button */}
            <Button 
                onClick={handleCreateDoc}
                variant="outline" 
                className="w-full justify-start gap-2 bg-background shadow-sm border-border/50 hover:bg-background/80"
            >
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-medium">New Doc</span>
            </Button>

            {/* Navigation */}
            <div className="space-y-0.5">
                {navItems.map((item) => (
                    <Link key={item.label} href={item.href}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start gap-2.5 font-normal h-9",
                                item.active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", item.active ? "text-foreground" : "text-muted-foreground")} />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Folders Mockup */}
            <div className="mt-4">
                <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
                    <Plus className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                </div>
                <div className="space-y-0.5">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 font-normal h-9 text-muted-foreground hover:text-foreground">
                        <Folder className="w-4 h-4" />
                        Journal
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 font-normal h-9 text-muted-foreground hover:text-foreground">
                        <Folder className="w-4 h-4" />
                        Ideas
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 font-normal h-9 text-muted-foreground hover:text-foreground">
                        <Folder className="w-4 h-4" />
                        Projects
                    </Button>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 font-normal h-9 text-muted-foreground hover:text-foreground">
                    <Settings className="w-4 h-4" />
                    Settings
                </Button>
            </div>
        </div>
    )
}
