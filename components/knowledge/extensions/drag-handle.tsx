"use client"

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, NodeSelection } from "@tiptap/pm/state"

export const DragHandle = Extension.create({
    name: "dragHandle",

    addProseMirrorPlugins() {
        let handleEl: HTMLDivElement | null = null
        let menuEl: HTMLDivElement | null = null
        let dragIndicatorEl: HTMLDivElement | null = null
        
        // Track the source block being dragged
        let activePos: number | null = null
        let activeSize: number | null = null
        
        // Track the potential drop target
        let dropTarget: { pos: number, side: 'left' | 'right', height: number, top: number, left: number } | null = null
        
        let hideTimer: ReturnType<typeof setTimeout> | null = null
        const view = this.editor.view
        const editor = this.editor

        function ensureHandle() {
            if (handleEl) return handleEl

            handleEl = document.createElement("div")
            handleEl.className = "drag-handle"
            handleEl.contentEditable = "false"
            handleEl.innerHTML = `
                <button class="drag-handle-btn drag-handle-add" title="Add block">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button class="drag-handle-btn drag-handle-grip" draggable="true" title="Drag to move · Click for menu">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                </button>
            `
            document.body.appendChild(handleEl)

            handleEl.addEventListener("mouseenter", () => {
                if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
            })
            handleEl.addEventListener("mouseleave", () => scheduleHide())

            const addBtn = handleEl.querySelector(".drag-handle-add") as HTMLButtonElement
            addBtn.addEventListener("mousedown", (e) => {
                e.preventDefault(); e.stopPropagation()
                if (activePos !== null && activeSize !== null) {
                    editor.chain().focus().insertContentAt(activePos + activeSize, { type: "paragraph" }).run()
                }
            })

            const grip = handleEl.querySelector(".drag-handle-grip") as HTMLButtonElement
            // Start Drag
            grip.addEventListener("dragstart", (e) => {
                if (activePos === null || activeSize === null) return
                const { state } = view
                const node = state.doc.nodeAt(activePos)
                if (!node) return

                try {
                    const sel = NodeSelection.create(state.doc, activePos)
                    view.dispatch(state.tr.setSelection(sel))
                } catch {
                    // Not all nodes support NodeSelection
                }

                const slice = state.doc.slice(activePos, activePos + activeSize)
                view.dragging = { slice, move: true }
                e.dataTransfer!.effectAllowed = "move"
                e.dataTransfer?.setData("text/plain", node.textContent || "")
                handleEl!.classList.add("is-dragging")
                view.dom.classList.add("dragging-active")
            })

            grip.addEventListener("dragend", () => {
                handleEl?.classList.remove("is-dragging")
                view.dom.classList.remove("dragging-active")
                clearDropIndicator()
                activePos = null
                activeSize = null
                dropTarget = null
            })

            grip.addEventListener("click", (e) => {
                e.preventDefault(); e.stopPropagation()
                openMenu()
            })

            return handleEl
        }

        function clearDropIndicator() {
            if (dragIndicatorEl) {
                dragIndicatorEl.remove()
                dragIndicatorEl = null
            }
            dropTarget = null
        }

        function updateDropIndicator(rect: DOMRect, side: 'left' | 'right') {
            if (!dragIndicatorEl) {
                dragIndicatorEl = document.createElement("div")
                dragIndicatorEl.className = "vertical-drop-cursor"
                document.body.appendChild(dragIndicatorEl)
            }
            dragIndicatorEl.style.position = "fixed" // Use fixed positioning
            dragIndicatorEl.style.height = `${rect.height}px`
            dragIndicatorEl.style.top = `${rect.top}px`
            dragIndicatorEl.style.left = side === 'left' ? `${rect.left - 2}px` : `${rect.right - 2}px`
            dragIndicatorEl.style.opacity = "1"
        }

        function openMenu() {
            closeMenu()
            if (!handleEl) return
            if (activePos === null) return

            menuEl = document.createElement("div")
            menuEl.className = "drag-handle-menu"
            
            const { state } = view
            const node = state.doc.nodeAt(activePos)
            const isColumns = node?.type.name === 'columns'

            menuEl.innerHTML = `
                <button data-action="delete">Delete</button>
                <button data-action="duplicate">Duplicate</button>
                ${!isColumns ? `
                <div class="separator"></div>
                <button data-action="cols2">2 Columns</button>
                <button data-action="cols3">3 Columns</button>
                ` : ''}
            `
            const rect = handleEl.getBoundingClientRect()
            menuEl.style.position = "fixed"
            menuEl.style.left = `${rect.left}px`
            menuEl.style.top = `${rect.bottom + 4}px`
            menuEl.style.zIndex = "100"
            document.body.appendChild(menuEl)

            menuEl.addEventListener("mousedown", (e) => {
                e.preventDefault(); e.stopPropagation()
                const btn = (e.target as HTMLElement).closest("button")
                if (!btn) return
                const action = btn.dataset.action
                if (activePos === null || activeSize === null) return
                const { state } = view

                if (action === "delete") {
                    view.dispatch(state.tr.delete(activePos, activePos + activeSize))
                } else if (action === "duplicate") {
                    const node = state.doc.nodeAt(activePos)
                    if (node) view.dispatch(state.tr.insert(activePos + activeSize, node.copy(node.content)))
                } else if (action === "cols2" || action === "cols3") {
                    const count = action === "cols2" ? 2 : 3
                    const node = state.doc.nodeAt(activePos)
                    if (node) {
                        const cols: any[] = [{ type: "column", content: [node.toJSON()] }]
                        for (let i = 1; i < count; i++) cols.push({ type: "column", content: [{ type: "paragraph" }] })
                        const columnsNode = state.schema.nodeFromJSON({ type: "columns", attrs: { count }, content: cols })
                        view.dispatch(state.tr.replaceWith(activePos, activePos + activeSize, columnsNode))
                    }
                }
                closeMenu()
            })
            setTimeout(() => document.addEventListener("mousedown", onOutsideClick), 0)
        }

        function onOutsideClick(e: MouseEvent) {
            if (menuEl && !menuEl.contains(e.target as Node)) closeMenu()
        }
        function closeMenu() {
            menuEl?.remove(); menuEl = null; document.removeEventListener("mousedown", onOutsideClick)
        }
        function scheduleHide() {
            hideTimer = setTimeout(() => { if (handleEl) handleEl.style.opacity = "0"; closeMenu() }, 400)
        }

        function positionHandle(event: MouseEvent) {
           const el = ensureHandle()
           if (el.classList.contains("is-dragging")) return
           
           const editorRect = view.dom.getBoundingClientRect()
           const result = view.posAtCoords({ left: editorRect.left + 10, top: event.clientY })
           if (!result) { el.style.opacity = "0"; return }
           
           const resolved = view.state.doc.resolve(result.pos)
           let depth = resolved.depth
           while (depth > 0) {
                const node = resolved.node(depth)
                if (node.isBlock && node.type.name !== 'doc' && node.type.name !== 'column') break
                depth--
           }
           if (depth < 1) { el.style.opacity = "0"; return }
           
           const blockPos = resolved.before(depth)
           const blockNode = resolved.node(depth)
           
           activePos = blockPos
           activeSize = blockNode.nodeSize

           const dom = view.nodeDOM(blockPos)
           if (!dom || !(dom instanceof HTMLElement)) { el.style.opacity = "0"; return }

           const blockRect = dom.getBoundingClientRect()
           el.style.position = "fixed"
           el.style.left = `${blockRect.left - 52}px`
           el.style.top = `${blockRect.top + 2}px`
           el.style.opacity = "1"
        }

        return [
            new Plugin({
                key: new PluginKey("dragHandle"),
                view() { return { destroy() { handleEl?.remove(); closeMenu(); clearDropIndicator() } } },
                props: {
                    handleDOMEvents: {
                        mousemove(_view, event) {
                            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
                            positionHandle(event)
                            return false
                        },
                        mouseleave(_view, event) {
                            const related = event.relatedTarget as HTMLElement
                            if (related && handleEl?.contains(related)) return false
                            scheduleHide()
                            return false
                        },
                        dragover(view, event) {
                            if (!activePos) return false
                            
                            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
                            if (!pos) return false
                            
                            let resolved = view.state.doc.resolve(pos.pos)
                            let depth = resolved.depth
                            while (depth > 0) {
                                const node = resolved.node(depth)
                                if (node.isBlock && node.type.name !== 'doc' && node.type.name !== 'columns' && node.type.name !== 'column') break
                                depth--
                            }
                            if (depth < 1) return false
                            
                            const targetPos = resolved.before(depth)
                            
                            // Don't drop on self
                            if (targetPos === activePos) {
                                clearDropIndicator()
                                return false
                            }

                            const dom = view.nodeDOM(targetPos)
                            if (!dom || !(dom instanceof HTMLElement)) return false
                            
                            const rect = dom.getBoundingClientRect()
                            const relX = event.clientX - rect.left
                            
                            // 20% zones, max 50px
                            const zoneWidth = Math.min(rect.width * 0.2, 50)
                            
                            if (relX < zoneWidth) {
                                dropTarget = { pos: targetPos, side: 'left', height: rect.height, top: rect.top, left: rect.left }
                                updateDropIndicator(rect, 'left')
                                event.preventDefault()
                                return true
                            } else if (relX > rect.width - zoneWidth) {
                                dropTarget = { pos: targetPos, side: 'right', height: rect.height, top: rect.top, left: rect.left }
                                updateDropIndicator(rect, 'right')
                                event.preventDefault()
                                return true
                            } else {
                                clearDropIndicator()
                                return false
                            }
                        },
                        dragleave() {
                            clearDropIndicator()
                            return false
                        },
                        drop(view, event) {
                            if (!dropTarget || activePos === null || activeSize === null) return false
                            
                            const { state } = view
                            const sourceNode = state.doc.nodeAt(activePos)
                            const targetNode = state.doc.nodeAt(dropTarget.pos)
                            
                            if (!sourceNode || !targetNode) return false

                            // Wrap in columns
                            const sourceContent = sourceNode.toJSON()
                            const targetContent = targetNode.toJSON()
                            
                            const col1 = { type: "column", content: [dropTarget.side === 'left' ? sourceContent : targetContent] }
                            const col2 = { type: "column", content: [dropTarget.side === 'left' ? targetContent : sourceContent] }
                            
                            const columnsNode = state.schema.nodeFromJSON({
                                type: "columns",
                                attrs: { count: 2 },
                                content: [col1, col2]
                            })
                            
                            let tr = state.tr
                            tr = tr.delete(activePos, activePos + activeSize)
                            const mappedTargetPos = tr.mapping.map(dropTarget.pos)
                            const mappedTargetNode = tr.doc.nodeAt(mappedTargetPos)
                            
                            if (mappedTargetNode) {
                                tr = tr.replaceWith(mappedTargetPos, mappedTargetPos + mappedTargetNode.nodeSize, columnsNode)
                                view.dispatch(tr)
                                event.preventDefault()
                                clearDropIndicator()
                                return true
                            }
                            
                           return false
                        }
                    },
                },
            }),
        ]
    },
})
