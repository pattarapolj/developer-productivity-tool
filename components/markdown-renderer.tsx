"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content.trim()) {
      return '<p class="text-muted-foreground italic">No content</p>'
    }

    let html = content
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    // Code blocks (```code```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-secondary/70 rounded-md p-3 my-2 overflow-x-auto"><code class="text-sm font-mono text-foreground">${code.trim()}</code></pre>`
    })

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2 text-foreground border-b border-border pb-1">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>')

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em class="italic text-foreground/90">$1</em>')
    html = html.replace(/___(.+?)___/g, '<strong class="font-bold"><em>$1</em></strong>')
    html = html.replace(/__(.+?)__/g, '<strong class="font-semibold text-foreground">$1</strong>')
    html = html.replace(/_(.+?)_/g, '<em class="italic text-foreground/90">$1</em>')

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 py-1 my-2 text-muted-foreground italic bg-primary/5 rounded-r">$1</blockquote>')

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="my-4 border-border" />')
    html = html.replace(/^\*\*\*$/gm, '<hr class="my-4 border-border" />')

    // Checkboxes
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-primary mt-0.5">✓</span><span class="line-through text-muted-foreground">$1</span></div>')
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-muted-foreground mt-0.5">○</span><span>$1</span></div>')

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc list-inside my-1">$1</li>')
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc list-inside my-1">$1</li>')

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal list-inside my-1">$1</li>')

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80">$1</a>')

    // Line breaks - convert double newlines to paragraphs
    const paragraphs = html.split(/\n\n+/)
    html = paragraphs
      .map((p) => {
        const trimmed = p.trim()
        // Don't wrap if it's already a block element
        if (
          trimmed.startsWith("<h") ||
          trimmed.startsWith("<pre") ||
          trimmed.startsWith("<blockquote") ||
          trimmed.startsWith("<hr") ||
          trimmed.startsWith("<li") ||
          trimmed.startsWith("<div")
        ) {
          return trimmed
        }
        // Wrap in paragraph if not empty
        if (trimmed) {
          return `<p class="my-2 leading-relaxed break-all">${trimmed.replace(/\n/g, "<br />")}</p>`
        }
        return ""
      })
      .join("")

    return html
  }, [content])

  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert overflow-hidden break-all", className)}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}
