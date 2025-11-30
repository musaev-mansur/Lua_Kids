import { Terminal } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OutputConsoleProps {
  output: string[]
  status?: "idle" | "success" | "error"
  error?: string | null
}

export function OutputConsole({ output, status = "idle", error }: OutputConsoleProps) {
  return (
    <div className="flex flex-col h-48 border rounded-lg overflow-hidden bg-black text-white font-mono text-sm">
      <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <Terminal className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Output</span>
      </div>
      <ScrollArea className="flex-1 p-4">
        {error ? (
          <div className="text-red-400 break-all">
            <span className="text-red-500 font-bold">Error: </span>
            {error}
          </div>
        ) : output.length === 0 ? (
          <div className="text-zinc-500 italic">Run your code to see output...</div>
        ) : (
          output.map((line, i) => (
            <div key={i} className="mb-1 break-all">
              <span className="text-zinc-500 mr-2">{">"}</span>
              <span className="text-green-400">{line}</span>
            </div>
          ))
        )}
        {status === "success" && <div className="mt-2 text-green-500 font-bold">✓ Execution Successful</div>}
        {status === "error" && <div className="mt-2 text-red-500 font-bold">✗ Execution Failed</div>}
      </ScrollArea>
    </div>
  )
}
