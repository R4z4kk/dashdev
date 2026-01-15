import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { HardDrive, Plus, Trash2, Terminal, Key, Search, Pencil, X } from 'lucide-react'
import { cn } from '../lib/utils'

interface Server {
  id: string
  name: string
  host: string
  port: string
  username: string
  keyName: string // Added to link an SSH key
}

export function Servers() {
  const [servers, setServers] = useState<Server[]>(() => {
    const saved = localStorage.getItem('dashdev_servers')
    return saved ? (JSON.parse(saved) as Server[]) : []
  })

  const location = useLocation()
  const navigate = useNavigate()

  // Initialize state from navigation if available
  const [newServer, setNewServer] = useState<Partial<Server>>(() => {
    const s = (location.state as { host?: string; port?: string } | null) || null
    return {
      name: '',
      host: s?.host || '',
      port: s?.port || '',
      username: '',
      keyName: ''
    }
  })

  const [keys, setKeys] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Load SSH Keys for the dropdown
    window.api.ssh.list().then(setKeys)
  }, [])

  const saveServers = (list: Server[]): void => {
    setServers(list)
    localStorage.setItem('dashdev_servers', JSON.stringify(list))
  }

  const handleAddStart = () => {
    setNewServer({ port: '', username: '', name: '', host: '', keyName: '' })
    setIsEditing(false)
  }

  const handleEditStart = (server: Server) => {
    setNewServer(server)
    setIsEditing(true)
  }

  const handleSave = (): void => {
    if (!newServer.host || !newServer.username || !newServer.keyName) return

    if (isEditing && newServer.id) {
      // Update existing
      const updatedList = servers.map((s) => (s.id === newServer.id ? (newServer as Server) : s))
      saveServers(updatedList)
    } else {
      // Add new
      const server: Server = {
        id: crypto.randomUUID(),
        name: newServer.name || newServer.host!,
        host: newServer.host!,
        port: newServer.port || '22',
        username: newServer.username!,
        keyName: newServer.keyName!
      }
      saveServers([...servers, server])
    }
    handleAddStart() // Reset form
  }

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string): void => {
    if (!confirm('Remove this server?')) return
    saveServers(servers.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight">My Servers</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {isEditing ? 'Edit Server' : 'Add Server'}
              </div>
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={handleAddStart}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Modify server details' : 'Manually add a server to your dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Input
                placeholder="Name (Optional)"
                value={newServer.name || ''}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Hostname or IP"
                  value={newServer.host || ''}
                  onChange={(e) => setNewServer({ ...newServer, host: e.target.value })}
                />
                <Input
                  className="w-24"
                  placeholder="Port"
                  value={newServer.port || ''}
                  onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
                />
              </div>
              <Input
                placeholder="Username"
                value={newServer.username || ''}
                onChange={(e) => setNewServer({ ...newServer, username: e.target.value })}
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground ml-1">SSH Key</label>
                <div className="relative">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newServer.keyName || ''}
                    onChange={(e) => setNewServer({ ...newServer, keyName: e.target.value })}
                  >
                    <option value="" disabled>
                      Select an SSH Key
                    </option>
                    {keys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={!newServer.host || !newServer.username || !newServer.keyName}
                className={isEditing ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {isEditing ? 'Update Server' : 'Add Server'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" /> Server List
            </CardTitle>
            <CardDescription>Your managed infrastructure</CardDescription>
          </CardHeader>
          {/* Removed inner scroll container and background */}
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredServers.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No servers added yet.
                </div>
              )}
              {filteredServers.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-md transition-colors cursor-pointer',
                    isEditing && newServer.id === s.id
                      ? 'border-primary bg-primary/5'
                      : 'bg-card hover:border-primary/50'
                  )}
                  onClick={() => navigate(`/servers/${s.id}`)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> {s.name}
                    </span>
                    <div className="flex gap-3 text-xs text-muted-foreground font-mono mt-1">
                      <span>
                        {s.username}@{s.host}:{s.port}
                      </span>
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3" /> {s.keyName || 'default'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStart(s)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(s.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
