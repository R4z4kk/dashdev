import { useState, useEffect } from 'react'
import { Rocket, Terminal, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../components/ui/button'

// Using local type for now
interface Deployment {
  id: string
  repo: string
  server: string
  command: string
  status: 'success' | 'failed'
  output: string
  timestamp: string
}

const DeploymentItem = ({ deployment }: { deployment: Deployment }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border rounded-md p-4 space-y-4 bg-card hover:bg-accent/5 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            {deployment.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            {deployment.repo}
          </h3>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Terminal className="w-3 h-3" /> {deployment.server}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(deployment.timestamp).toLocaleString()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-8"
          >
            {isExpanded ? (
              <>
                Hide logs <ChevronUp className="ml-1 w-3 h-3" />
              </>
            ) : (
              <>
                See logs <ChevronDown className="ml-1 w-3 h-3" />
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-muted/50 p-4 rounded text-sm font-mono whitespace-pre-wrap break-all shadow-inner animate-in slide-in-from-top-2 duration-200">
          <div className="text-muted-foreground select-none border-b pb-2 mb-2 border-border/50">
            $ {deployment.command}
          </div>
          <div className={deployment.status === 'success' ? 'text-foreground' : 'text-red-500'}>
            {deployment.output || 'No output recorded'}
          </div>
        </div>
      )}
    </div>
  )
}

export function Deployments() {
  const [deployments] = useState<Deployment[]>(() => {
    const saved = localStorage.getItem('dashdev_deployments')
    return saved ? JSON.parse(saved).reverse() : []
  })

  useEffect(() => {
    // Other side effects if needed
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Rocket className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Recent Deployments</h1>
      </div>

      <div className="space-y-4">
        {deployments.length === 0 && (
          <div className="text-center text-muted-foreground p-12 border rounded-lg border-dashed">
            No deployments recorded yet. Go to Repositories to trigger one.
          </div>
        )}
        {deployments.map((d) => (
          <DeploymentItem key={d.id} deployment={d} />
        ))}
      </div>
    </div>
  )
}
