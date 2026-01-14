import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Server as ServerIcon, RefreshCw, Plus } from 'lucide-react'

export function NetworkScan() {
  const [networkHosts, setNetworkHosts] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async (): Promise<void> => {
    setIsScanning(true)
    try {
      const res = await window.api.network.scan()
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
          <Button onClick={handleScan} disabled={isScanning} className="w-full" variant="secondary">
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Scanning Subnet...
              </>
            ) : (
              'Scan Local Network'
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
