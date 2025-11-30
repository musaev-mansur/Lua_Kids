"use client"

import { FileText, Lock, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PdfViewerProps {
  pdfUrl?: string
  isUnlocked?: boolean
  title?: string
}

export function PdfViewer({ pdfUrl, isUnlocked = true, title = "PDF материал" }: PdfViewerProps) {
  if (!pdfUrl) {
    return null
  }

  if (!isUnlocked) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">PDF файл заблокирован</p>
          <p className="text-xs text-muted-foreground">
            Выполните задание, чтобы получить доступ к PDF файлу.
          </p>
        </div>
        <Badge variant="secondary">Заблокировано</Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <FileText className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">PDF файл доступен для скачивания</p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4" />
          Открыть PDF
        </a>
      </Button>
    </div>
  )
}

