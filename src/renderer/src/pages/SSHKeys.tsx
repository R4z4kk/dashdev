import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Shield, Key, Trash2, Copy } from 'lucide-react'

export function SSHKeys() {
  const [keys, setKeys] = useState<string[]>([])
  const [newKeyName, setNewKeyName] = useState('')

  const loadKeys = async (): Promise<void> => {
    try {
      const k = await window.api.ssh.list()
      setKeys(k)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadKeys()
  }, [])

  const handleGenerate = async (): Promise<void> => {
    if (!newKeyName) return
    try {
      await window.api.ssh.generate(newKeyName, 'user@dashdev.local')
      await loadKeys()
      setNewKeyName('')
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopy = async (name: string): Promise<void> => {
    try {
      const pubKey = await window.api.ssh.getPublicKey(name)
      await navigator.clipboard.writeText(pubKey)
      // Visual feedback could be added here (toast)
      alert(`Public key for ${name} copied to clipboard!`)
    } catch (e) {
      console.error('Copy failed', e)
      alert('Failed to copy key')
    }
  }

  const handleDelete = async (name: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete key "${name}"? This cannot be undone.`)) return
    try {
      await window.api.ssh.delete(name)
      await loadKeys()
    } catch (e) {
      console.error(e)
      alert('Failed to delete key')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">SSH Keys</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Manage Keys
          </CardTitle>
          <CardDescription>Generate and manage your local SSH keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key Name (e.g. prod-server)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Button onClick={handleGenerate} disabled={!newKeyName}>
              <Key className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
          <div className="space-y-2">
            {keys.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">No keys found.</div>
            )}
            {keys.map((k) => (
              <div
                key={k}
                className="flex justify-between items-center p-2 hover:bg-accent rounded text-sm transition-colors"
              >
                <span className="font-mono">{k}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(k)}
                    title="Copy Public Key"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(k)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    title="Delete Key"
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
  )
}
