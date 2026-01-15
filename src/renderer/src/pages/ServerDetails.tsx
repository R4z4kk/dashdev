import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft, RefreshCw, Cpu, HardDrive, Network, ShieldCheck, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ServerMetrics, fetchServerMetrics } from '../lib/server-metrics'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { cn } from '../lib/utils'

interface Server {
  id: string
  name: string
  host: string
  port: string
  username: string
  keyName: string
}

export function ServerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [server, setServer] = useState<Server | null>(null)
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ time: string; cpu: number; ram: number }[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('dashdev_servers')
    if (saved) {
      const list = JSON.parse(saved)
      const found = list.find((s: Server) => s.id === id)
      if (found) {
        setServer(found)
        loadMetrics(found)
      } else {
        setError('Server not found')
      }
    }
  }, [id])

  // Polling
  useEffect(() => {
    if (!server) return
    const interval = setInterval(() => {
      loadMetrics(server, true)
    }, 5000)
    return () => clearInterval(interval)
  }, [server])

  const loadMetrics = async (srv: Server, silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await fetchServerMetrics(srv)
      setMetrics(data)

      setHistory((prev) => {
        const now = new Date().toLocaleTimeString()
        const newPoint = {
          time: now,
          cpu: data.cpu.usage,
          ram: Math.round((data.ram.used / data.ram.total) * 100)
        }
        const newHistory = [...prev, newPoint]
        if (newHistory.length > 20) newHistory.shift() // Keep last 20 points
        return newHistory
      })
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : String(err)
      setError('Failed to fetch metrics: ' + message)
    } finally {
      setLoading(false)
    }
  }

  if (!server) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <div className="mt-8 text-center text-muted-foreground">{error || 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/servers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{server.name}</h1>
            <p className="text-muted-foreground text-sm font-mono">
              {server.username}@{server.host}:{server.port}
            </p>
          </div>
        </div>
        <Button onClick={() => loadMetrics(server)} disabled={loading} variant="outline">
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {metrics ? (
        <div className="space-y-6">
          {/* Top Row: Key Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpu.usage}%</div>
                <p className="text-xs text-muted-foreground">
                  Load Avg: {metrics.cpu.loadAvg.join(', ')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((metrics.ram.used / metrics.ram.total) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.ram.used}MB / {metrics.ram.total}MB
                </p>
                {metrics.ram.swapUsed > 0 && (
                  <span className="text-xs text-yellow-600">Swap: {metrics.ram.swapUsed}MB</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.disk.usagePercent}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.disk.used} / {metrics.disk.total}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.network.connections} Conn</div>
                <p className="text-xs text-muted-foreground">
                  Rx: {(metrics.network.rxBytes / 1024 / 1024).toFixed(1)}MB | Tx:{' '}
                  {(metrics.network.txBytes / 1024 / 1024).toFixed(1)}MB
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Real-time History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cpu"
                        stroke="#8884d8"
                        name="CPU %"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ram"
                        stroke="#82ca9d"
                        name="RAM %"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Disk Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span>Space Used</span>
                  <span className="font-bold">
                    {metrics.disk.used} / {metrics.disk.total} ({metrics.disk.usagePercent}%)
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${metrics.disk.usagePercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm mt-4">
                  <span>Inodes (Files)</span>
                  <span className="font-bold">
                    {metrics.disk.inodesUsed} / {metrics.disk.inodesTotal} (
                    {metrics.disk.inodesPercent}%)
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${metrics.disk.inodesPercent}%` }}
                  />
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">IO Read</span>
                    <span className="font-mono">{metrics.io.read} blk/s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">IO Write</span>
                    <span className="font-mono">{metrics.io.write} blk/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">Failed SSH Attempts:</span>
                  <div className="text-2xl font-bold mt-1">{metrics.system.failedSSH || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Check /var/log/auth.log permission if N/A
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground block">Uptime</span>
                    <span className="font-medium">{metrics.system.uptime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Load Average</span>
                    <span className="font-mono text-xs">{metrics.cpu.loadAvg.join('  ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Memory Composition</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Used', value: metrics.ram.used },
                        { name: 'Free', value: metrics.ram.free },
                        { name: 'Cache', value: metrics.ram.cached }
                      ]}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {/* Used = Red/Orange, Free = Green, Cache = Blue */}
                      <Cell fill="#ef4444" />
                      <Cell fill="#22c55e" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Used
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> Free
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Cache
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
          {loading ? <p>Connecting to server...</p> : <p>No metrics available</p>}
        </div>
      )}
    </div>
  )
}
