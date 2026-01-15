import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Server as ServerIcon, RefreshCw, Plus } from 'lucide-react'

export function NetworkScan() {
  const [networkHosts, setNetworkHosts] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [interfaces, setInterfaces] = useState<any[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [customTarget, setCustomTarget] = useState<string>('')
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')

  // Load interfaces on mount
  useEffect(() => {
    window.api.network.getInterfaces().then((ifaces) => {
      setInterfaces(ifaces)
      // Default to first likely candidate
      const candidate = ifaces.find(
        (i) => !i.internal && (i.address.startsWith('192.168.') || i.address.startsWith('10.'))
      )
      if (candidate) {
        setSelectedTarget(candidate.subnet)
      } else if (ifaces.length > 0) {
        setSelectedTarget(ifaces[0].subnet)
      }
    })
  }, [])

  const handleScan = async (): Promise<void> => {
    setIsScanning(true)
    setNetworkHosts([])
    try {
      const target = mode === 'auto' ? selectedTarget : customTarget
      const res = await window.api.network.scan(target)
      setNetworkHosts(res)
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanning(false)
    }
  }

  const navigate = useNavigate()

  const handleAddServer = (host: any): void => {
    navigate('/servers', { state: { host: host.ip, port: host.port.toString() } })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight">Network Scanning</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" /> Network Discovery
          </CardTitle>
          <CardDescription>Scan local network for SSH servers (Port 22)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 p-4 border rounded-md bg-muted/20">
            <div className="flex gap-4">
              <Button
                variant={mode === 'auto' ? 'default' : 'outline'}
                onClick={() => setMode('auto')}
                className="flex-1"
              >
                Select Subnet
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'outline'}
                onClick={() => setMode('custom')}
                className="flex-1"
              >
                Custom Range
              </Button>
            </div>

            {mode === 'auto' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Interface / Subnet:</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                >
                  {interfaces.map((iface) => (
                    <option key={iface.name} value={iface.subnet}>
                      {iface.name} - {iface.address} ({iface.subnet})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Target IP Range (CIDR):</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.122.0/24"
                  className="w-full p-2 border rounded-md bg-background"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button onClick={handleScan} disabled={isScanning} className="w-full" variant="secondary">
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Scanning{' '}
                {mode === 'auto' ? selectedTarget : customTarget}...
              </>
            ) : (
              'Scan Network'
            )}
          </Button>

          <div className="space-y-2">
            {networkHosts.length === 0 && !isScanning && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No servers detected yet.
              </div>
            )}
            {networkHosts.map((host, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-transparent hover:border-border p-3 rounded-md bg-card shadow-sm"
              >
                <div>
                  <div className="font-medium font-mono">{host.ip}</div>
                  <div className="text-xs text-green-500">Port {host.port} Open</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddServer(host)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to My Servers
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
