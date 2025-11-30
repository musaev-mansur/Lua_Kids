"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RefreshCw } from "lucide-react"

interface CodeEditorProps {
  initialCode: string
  onRun: (code: string) => void
  isRunning: boolean
}

export function CodeEditor({ initialCode, onRun, isRunning }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  // Reset code when initialCode changes (new lesson)
  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const value = e.currentTarget.value
      setCode(value.substring(0, start) + "  " + value.substring(end))
      // Note: cursor position update would need a ref
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-blue-400">script.lua</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setCode(initialCode)}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onRun(code)}
            disabled={isRunning}
          >
            <Play className="mr-1 h-3 w-3" />
            {isRunning ? "Running..." : "Run Script"}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 font-mono text-sm">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-gray-300 resize-none focus:outline-none spellcheck-false"
          spellCheck={false}
          style={{ lineHeight: "1.5" }}
        />
      </div>
    </div>
  )
}
