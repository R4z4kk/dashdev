import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Star, ExternalLink, Rocket, X } from 'lucide-react'

interface DeployModalProps {
  repoName: string
  onClose: () => void
  onDeploy: (server: any, key: string, command: string) => Promise<void>
}

function DeployModal({ repoName, onClose, onDeploy }: DeployModalProps) {
  const [servers] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('dashdev_servers') || '[]')
  })
  const [selectedServer, setSelectedServer] = useState(() => {
    const s = JSON.parse(localStorage.getItem('dashdev_servers') || '[]')
    return s.length > 0 ? s[0].id : ''
  })
  const [command, setCommand] = useState(
    'cd /var/www/app && git pull && npm install && npm run build && pm2 restart app'
  )
  const [loading, setLoading] = useState(false)

  // Auto-select first server if none selected
  useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedServer(servers[0].id)
    }
  }, [servers, selectedServer])

  const handleDeploy = async () => {
    setLoading(true)
    const s = servers.find((srv) => srv.id === selectedServer)
    if (!s) return

    // Use the key associated with the server
    await onDeploy(s, s.keyName || '', command)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Deploy {repoName}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Server</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.host})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Launch Command</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleDeploy}
            disabled={loading || servers.length === 0}
          >
            {loading ? 'Deploying...' : 'Run Deployment'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Repos() {
  const [repos, setRepos] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [deployRepo, setDeployRepo] = useState<string | null>(null)

  useEffect(() => {
    const loadRepos = async () => {
      try {
        const r = await window.api.github.listRepos(50) // Increased limit
        setRepos(r)
      } catch (e) {
        console.error(e)
      }
    }
    loadRepos()
  }, [])

  const handleDeployAction = async (server: any, key: string, command: string) => {
    if (!deployRepo) return

    // Create record
    const deploymentId = crypto.randomUUID()
    const record = {
      id: deploymentId,
      repo: deployRepo,
      server: server.name || server.host,
      command: command,
      status: 'pending',
      output: '',
      timestamp: new Date().toISOString()
    }

    // Optimistic save
    const save = (r: any) => {
      const list = JSON.parse(localStorage.getItem('dashdev_deployments') || '[]')
      localStorage.setItem('dashdev_deployments', JSON.stringify([...list, r]))
    }

    try {
      const output = await window.api.ssh.exec(
        server.host,
        server.port,
        server.username,
        key,
        command
      )
      // Check if output implies error? usually exit code is better but exec returns stdout/stderr string.
      // We'll assume if exec throws it's error, if it returns string it's "success" (even if stderr is content, often warnings).
      // But ssh.ts returns stdout || stderr.
      // We will mark as success for now.

      save({ ...record, status: 'success', output })
      alert('Deployment finished successfully!')
    } catch (e: any) {
      save({ ...record, status: 'failed', output: e.message || String(e) })
      alert('Deployment failed. Check Deployments tab.')
    }
  }

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {deployRepo && (
        <DeployModal
          repoName={deployRepo}
          onClose={() => setDeployRepo(null)}
          onDeploy={handleDeployAction}
        />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <div className="w-64">
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((repo) => (
          <Card key={repo.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-start gap-2">
                <span className="truncate" title={repo.name}>
                  {repo.name}
                </span>
                <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-normal">
                  {repo.visibility}
                </span>
              </CardTitle>
              <CardDescription className="line-clamp-2 h-10">
                {repo.description || 'No description provided'}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> {repo.stargazerCount}
                </div>
                <div className="text-xs">
                  Updated {new Date(repo.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(repo.url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setDeployRepo(repo.name)}>
                  <Rocket className="w-3 h-3 mr-2" />
                  Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
