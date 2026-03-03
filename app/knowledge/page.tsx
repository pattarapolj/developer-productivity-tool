"use client"

import { useEffect, useState } from "react"
import { useToolingTrackerStore } from "@/lib/store"
import { DocCard } from "@/components/knowledge/doc-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, Star, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function KnowledgePage() {
    const router = useRouter()
    const { docs, addDoc, deleteDoc, updateDoc, isLoading } = useToolingTrackerStore()
    const [search, setSearch] = useState("")
    const [view, setView] = useState<"all" | "favorites">("all")

    // Filter docs
    const allDocs = docs.filter(doc => !doc.isArchived)
    
    const filteredDocs = allDocs.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase())
    )

    const favoriteDocs = allDocs.filter(doc => doc.isFavorite)
    // We don't display "Recent" section anymore, just display filteredDocs in main grid
    // But we might want to sort by updated.
    // displayDocs is already filtered by search/view.
    // Let's sort filteredDocs by updated desc.
    const displayDocs = (view === "favorites" 
        ? filteredDocs.filter(d => d.isFavorite)
        : filteredDocs
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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

    return (
        <div className="h-full flex flex-col overflow-y-auto p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">All Docs</h1>
                    <span className="text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-md text-sm">
                        {displayDocs.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-9 h-9 bg-background/50 border-border/50 focus:bg-background transition-all rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/50">
                        <button 
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setView("all")}
                            title="All Documents"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === "favorites" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setView("favorites")}
                            title="Favorites"
                        >
                            <Star className="w-4 h-4" />
                        </button>
                    </div>
                    <Button onClick={handleCreateDoc} className="hidden md:flex rounded-xl gap-2 shadow-sm">
                        <Plus className="w-4 h-4" />
                        New
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1">
                {isLoading && docs.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    </div>
                ) : allDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center text-3xl">
                            📝
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No documents yet</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                                Create your first document to start building your knowledge base.
                            </p>
                        </div>
                        <Button onClick={handleCreateDoc} size="lg" className="rounded-xl mt-4">
                            Create Document
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Favorites Section - Only show if view is 'all' and we have favorites */}
                        {view === "all" && favoriteDocs.length > 0 && !search && (
                            <section>
                                <h2 className="text-sm font-semibold text-muted-foreground mb-4 pl-1">Favorites</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {favoriteDocs.map(doc => (
                                        <DocCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            onDelete={deleteDoc}
                                            onToggleFavorite={(id) => {
                                                const d = docs.find(d => d.id === id)
                                                if (d) updateDoc(id, { isFavorite: !d.isFavorite })
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Main Grid */}
                        <section>
                            {(view === "all" && favoriteDocs.length > 0 && !search) && (
                                <h2 className="text-sm font-semibold text-muted-foreground mb-4 pl-1">Recent</h2>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {displayDocs.map(doc => (
                                    <DocCard 
                                        key={doc.id} 
                                        doc={doc} 
                                        onDelete={deleteDoc}
                                        onToggleFavorite={(id) => {
                                            const d = docs.find(d => d.id === id)
                                            if (d) updateDoc(id, { isFavorite: !d.isFavorite })
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    )
}
