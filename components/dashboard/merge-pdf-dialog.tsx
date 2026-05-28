"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileType, Trash2, GripVertical, Download, Loader2 } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import Script from "next/script"

type PDFFileItem = {
    id: string
    file: File
}

function SortableItem({ item, onRemove }: { item: PDFFileItem, onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <FileType className="h-6 w-6 text-red-500" />
            <div className="flex-1 truncate text-sm font-medium">
                {item.file.name}
            </div>
            <div className="text-xs text-muted-foreground">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => onRemove(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function MergePdfDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [files, setFiles] = useState<PDFFileItem[]>([])
    const [isMerging, setIsMerging] = useState(false)
    const [pdfLibLoaded, setPdfLibLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).PDFLib) {
            setPdfLibLoaded(true)
        }
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(f => f.type === "application/pdf").map(file => ({
                id: Math.random().toString(36).substring(7),
                file
            }))
            setFiles(prev => [...prev, ...newFiles])
        }
        e.target.value = ""
    }

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error("Please add at least 2 PDF files to merge.")
            return
        }
        if (!(window as any).PDFLib) {
            toast.error("PDF Library not loaded yet. Please wait.")
            return
        }

        setIsMerging(true)
        try {
            const PDFLib = (window as any).PDFLib
            const mergedPdf = await PDFLib.PDFDocument.create()

            for (const item of files) {
                const arrayBuffer = await item.file.arrayBuffer()
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer)
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
                copiedPages.forEach((page: any) => mergedPdf.addPage(page))
            }

            const mergedPdfFile = await mergedPdf.save()
            const blob = new Blob([mergedPdfFile], { type: "application/pdf" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `merged_${Date.now()}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            toast.success("PDFs merged successfully!")
            onOpenChange(false)
            setFiles([])
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to merge PDFs: " + error.message)
        } finally {
            setIsMerging(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {!pdfLibLoaded && <Script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js" strategy="lazyOnload" onLoad={() => setPdfLibLoaded(true)} />}
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Merge PDFs</DialogTitle>
                    <DialogDescription>
                        Upload multiple PDF files, drag to reorder, and merge them into a single file.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById('merge-upload')?.click()}>
                        <UploadCloud className="h-8 w-8 text-primary mb-2" />
                        <p className="font-medium">Click to add PDFs</p>
                        <p className="text-xs text-muted-foreground">Select multiple files</p>
                        <input id="merge-upload" type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto p-1">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    {files.map(item => (
                                        <SortableItem key={item.id} item={item} onRemove={removeFile} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleMerge} disabled={files.length < 2 || isMerging || !pdfLibLoaded}>
                        {isMerging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        {isMerging ? "Merging..." : "Merge PDFs"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
