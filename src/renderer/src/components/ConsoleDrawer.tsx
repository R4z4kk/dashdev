import { Terminal, ChevronUp, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'

export function ConsoleDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs] = useState<string[]>(['> Dashdev initialized.'])

  // Mock log listener or use a real context
  useEffect(() => {
    // In a real app, hook into a global logging context or IPC event
  }, [])

  return (
    <div
      className={cn(
        'fixed bottom-0 left-64 right-0 border-t bg-black text-green-400 font-mono text-sm transition-all duration-300 z-50 flex flex-col shadow-2xl',
        isOpen ? 'h-64' : 'h-10'
      )}
    >
      <div
        className="flex items-center justify-between px-4 h-10 bg-zinc-900 cursor-pointer hover:bg-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span>Console Log</span>
        </div>
        <div className="flex items-center">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-1">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}
