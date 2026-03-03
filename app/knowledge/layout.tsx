import { KnowledgeSidebar } from "@/components/knowledge/knowledge-sidebar"

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            <KnowledgeSidebar />
            <main className="flex-1 h-full min-w-0 bg-background/50">
                {children}
            </main>
        </div>
    )
}
