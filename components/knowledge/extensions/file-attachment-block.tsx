"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { 
    FileText, 
    FileSpreadsheet, 
    FileImage,
    File,
    FileArchive,
    Presentation,
    Download,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function getFileIcon(fileType: string, fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    
    if (fileType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
        return <FileImage className="w-5 h-5 text-purple-400" />
    }
    if (fileType.includes('pdf') || ext === 'pdf') {
        return <FileText className="w-5 h-5 text-red-400" />
    }
    if (fileType.includes('word') || ['doc', 'docx'].includes(ext)) {
        return <FileText className="w-5 h-5 text-blue-400" />
    }
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet className="w-5 h-5 text-green-400" />
    }
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || ['ppt', 'pptx'].includes(ext)) {
        return <Presentation className="w-5 h-5 text-orange-400" />
    }
    if (fileType.includes('onenote') || ['one', 'onenote'].includes(ext)) {
        return <FileText className="w-5 h-5 text-violet-400" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <FileArchive className="w-5 h-5 text-yellow-400" />
    }
    return <File className="w-5 h-5 text-muted-foreground" />
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function FileAttachmentComponent({ node, deleteNode }: any) {
    const { fileName, fileSize, fileType, dataUrl } = node.attrs

    const handleDownload = () => {
        if (!dataUrl) return
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = fileName
        link.click()
    }

    const handleOpen = () => {
        if (!dataUrl) return
        // For images, open in new tab
        if (fileType?.startsWith('image/')) {
            window.open(dataUrl, '_blank')
            return
        }
        // For PDF, try to open in new tab
        if (fileType?.includes('pdf')) {
            window.open(dataUrl, '_blank')
            return
        }
        // For others, download
        handleDownload()
    }

    return (
        <NodeViewWrapper className="my-3">
            <div 
                contentEditable={false}
                className="file-attachment-block group relative flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 hover:bg-card transition-all cursor-pointer"
                onClick={handleOpen}
            >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 shrink-0">
                    {getFileIcon(fileType || '', fileName || '')}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{fileName || "Untitled file"}</div>
                    <div className="text-xs text-muted-foreground">
                        {formatFileSize(fileSize || 0)} • Click to open
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDownload()
                        }}
                        title="Download"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            deleteNode()
                        }}
                        title="Remove"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </NodeViewWrapper>
    )
}

export const FileAttachmentBlock = Node.create({
    name: "fileAttachmentBlock",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            fileName: { default: null },
            fileSize: { default: 0 },
            fileType: { default: null },
            dataUrl: { default: null },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-file-attachment]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-file-attachment": "" }),
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(FileAttachmentComponent)
    },
})
