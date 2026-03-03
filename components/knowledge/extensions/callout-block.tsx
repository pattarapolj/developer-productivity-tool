"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Info, AlertTriangle, Lightbulb, AlertOctagon } from "lucide-react"

const CALLOUT_TYPES = {
    info: { color: "border-blue-500/30 bg-blue-500/5", iconColor: "text-blue-400", icon: "ℹ️", label: "Info" },
    warning: { color: "border-yellow-500/30 bg-yellow-500/5", iconColor: "text-yellow-400", icon: "⚠️", label: "Warning" },
    tip: { color: "border-green-500/30 bg-green-500/5", iconColor: "text-green-400", icon: "💡", label: "Tip" },
    danger: { color: "border-red-500/30 bg-red-500/5", iconColor: "text-red-400", icon: "🚨", label: "Danger" },
} as const

type CalloutType = keyof typeof CALLOUT_TYPES

function CalloutComponent({ node, updateAttributes }: any) {
    const [showTypePicker, setShowTypePicker] = useState(false)
    const type = (node.attrs.type as CalloutType) || "info"
    const icon = node.attrs.icon || CALLOUT_TYPES[type].icon
    const config = CALLOUT_TYPES[type]

    return (
        <NodeViewWrapper className="my-3">
            <div className={cn(
                "callout-block rounded-lg border-l-4 p-4 relative group",
                config.color
            )}>
                <div className="flex items-start gap-3">
                    <button
                        contentEditable={false}
                        className="text-xl cursor-pointer hover:scale-110 transition-transform shrink-0 mt-0.5 relative"
                        onClick={() => setShowTypePicker(!showTypePicker)}
                        title="Change callout type"
                    >
                        {icon}
                    </button>
                    <NodeViewContent className="flex-1 text-sm leading-relaxed min-w-0 callout-content" />
                </div>
                
                {/* Type picker dropdown */}
                {showTypePicker && (
                    <div 
                        contentEditable={false}
                        className="absolute top-12 left-4 z-50 flex gap-1 rounded-lg border border-border bg-card p-1.5 shadow-xl"
                    >
                        {(Object.keys(CALLOUT_TYPES) as CalloutType[]).map((t) => (
                            <button
                                key={t}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                    type === t ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"
                                )}
                                onClick={() => {
                                    updateAttributes({ type: t, icon: CALLOUT_TYPES[t].icon })
                                    setShowTypePicker(false)
                                }}
                            >
                                <span>{CALLOUT_TYPES[t].icon}</span>
                                {CALLOUT_TYPES[t].label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    )
}

export const CalloutBlock = Node.create({
    name: "calloutBlock",
    group: "block",
    content: "block+",
    defining: true,
    draggable: true,

    addAttributes() {
        return {
            type: {
                default: "info",
            },
            icon: {
                default: "ℹ️",
            },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-callout]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout-block" }),
            0,
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutComponent)
    },
})
