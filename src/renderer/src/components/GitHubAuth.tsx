import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, Download, LogIn, CheckCircle2, Loader2 } from 'lucide-react'

interface GitHubAuthProps {
  onAuthenticated: () => void
}

export function GitHubAuth({ onAuthenticated }: GitHubAuthProps) {
  const [status, setStatus] = useState<'checking' | 'missing' | 'installed' | 'authenticated'>(
    'checking'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const installed = await window.api.github.checkVersion()
      if (!installed) {
        setStatus('missing')
        return
      }

      const logged = await window.api.github.isLogged()
      if (logged) {
        setStatus('authenticated')
        onAuthenticated()
      } else {
        setStatus('installed')
      }
    } catch (e) {
      console.error(e)
      setStatus('missing')
    }
  }

  const handleInstall = async () => {
    setLoading(true)
    setError('')
    try {
      await window.api.github.install()
      // Re-check after install
      await checkStatus()
    } catch (e: any) {
      setError(e.message || 'Installation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await window.api.github.login()
      // Start polling for status
      const interval = setInterval(async () => {
        const logged = await window.api.github.isLogged()
        if (logged) {
          clearInterval(interval)
          setStatus('authenticated')
          onAuthenticated()
          setLoading(false)
        }
      }, 2000)

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(interval)
        if (status !== 'authenticated') setLoading(false)
      }, 120000)
    } catch (e: any) {
      setError(e.message || 'Login failed')
      setLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Dashdev requires GitHub CLI to fetch your repository stats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {status === 'missing' && (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md text-sm text-yellow-500">
                GitHub CLI (gh) was not found on your system.
              </div>
              <Button onClick={handleInstall} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Install GitHub CLI
              </Button>
            </div>
          )}

          {status === 'installed' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-md text-sm text-blue-500">
                CLI is installed but you are not logged in.
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Connect GitHub Account
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                This will open your browser to authenticate.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
