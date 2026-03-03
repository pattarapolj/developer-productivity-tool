"use client"

import { Node, mergeAttributes } from "@tiptap/core"

// ============================================================
// Column – individual cell within a columns layout
// ============================================================
export const Column = Node.create({
    name: "column",
    group: "column",
    content: "block+",
    defining: true,
    // isolating: true, // Removed to allow dragging out

    parseHTML() {
        return [{ tag: 'div[data-column]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-column": "",
                class: "column-node",
            }),
            0,
        ]
    },
})

// ============================================================
// Columns – grid wrapper holding 2-4 Column nodes
// ============================================================
export const Columns = Node.create({
    name: "columns",
    group: "block",
    content: "column{2,4}",
    defining: true,
    draggable: true,
    // isolating: true, // Removed

    addAttributes() {
        return {
            count: {
                default: 2,
                parseHTML: (el: HTMLElement) =>
                    parseInt(el.getAttribute("data-count") || "2", 10),
            },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-columns]' }]
    },

    renderHTML({ node, HTMLAttributes }) {
        const count = node.attrs.count || 2
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-columns": "",
                "data-count": String(count),
                class: "columns-grid",
                style: `display:grid;grid-template-columns:repeat(${count},1fr);gap:12px`,
            }),
            0,
        ]
    },
})
