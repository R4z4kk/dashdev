import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Rocket, Terminal, CheckCircle, XCircle, Clock } from 'lucide-react'

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

export function Deployments() {
  const [deployments] = useState<Deployment[]>(() => {
    const saved = localStorage.getItem('dashdev_deployments')
    return saved ? JSON.parse(saved).reverse() : []
  })

  useEffect(() => {
    // Other side effects if needed
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" /> Recent Deployments
          </CardTitle>
          <CardDescription>History of deployment tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deployments.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                No deployments recorded yet. Go to Repositories to trigger one.
              </div>
            )}
            {deployments.map((d) => (
              <div
                key={d.id}
                className="border rounded-md p-4 space-y-2 bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {d.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      {d.repo}
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Terminal className="w-3 h-3" /> {d.server}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 p-2 rounded text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                  <div className="text-muted-foreground select-none">$ {d.command}</div>
                  <div className={d.status === 'success' ? 'text-foreground' : 'text-red-500'}>
                    {d.output}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
