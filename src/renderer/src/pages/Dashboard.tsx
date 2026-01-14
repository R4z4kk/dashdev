import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Activity,
  GitPullRequest,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Code2,
  ExternalLink
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { GitHubAuth } from '../components/GitHubAuth'

export function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Initial check
  useEffect(() => {
    window.api.github.isLogged().then(setIsAuthenticated)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadStats()
    }
  }, [isAuthenticated])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await window.api.github.stats()
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-in fade-in duration-500">
        <GitHubAuth onAuthenticated={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        Loading dashboard metrics...
      </div>
    )
  }

  // Derived Data
  const recentCommits = stats.commits || []
  const prs = stats.prs || []
  const runs = stats.runs || []
  const alerts = stats.alerts || []
  const repos = stats.repos || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full border border-border">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            GitHub Connected
          </div>
        </div>
      </div>

      {/* SECTION 1: HEALTH & ACTIONABLE */}
      <h2 className="text-xl font-semibold tracking-tight border-b pb-2">Health & Urgencies</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* CI/CD Status */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {runs.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No recent runs found.</span>
              )}
              {runs.map((run: any) => (
                <div key={run.url} className="flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {run.conclusion === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : run.conclusion === 'failure' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    )}
                    <span className="truncate font-medium text-foreground/80">
                      {run.repo}: {run.workflowName}
                    </span>
                  </div>
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PR Blockers */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRs Pending Review</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prs.length}</div>
            <div className="space-y-2 mt-2">
              {prs.length === 0 && (
                <p className="text-xs text-muted-foreground italic">You are all caught up!</p>
              )}
              {prs.map((pr: any) => (
                <div
                  key={pr.url}
                  className="text-xs truncate text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <a href={pr.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    • {pr.title}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="space-y-2 mt-2">
              {alerts.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No security alerts detected.</p>
              )}
              {alerts.slice(0, 3).map((alert: any, idx: number) => (
                <div key={idx} className="text-xs flex flex-col gap-0.5 border-b border-border/50 pb-1 last:border-0">
                  <span className="font-semibold text-red-500 uppercase text-[10px]">
                    {alert.severity}
                  </span>
                  <a href={alert.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    {alert.repo}: {alert.summary}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: REPOS & ACTIVITY */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Repositories Overview */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Repositories Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repos.map((repo: any) => (
                <div key={repo.url} className="flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{repo.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {repo.primaryLanguage && (
                        <span className="flex items-center gap-1">
                          <Code2 className="w-3 h-3" />
                          {repo.primaryLanguage.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {repo.stargazerCount}
                      </span>
                    </div>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Latest Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCommits.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No recent activity found.</p>
              )}
              {recentCommits.map((c: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 pr-4">
                    <p className="text-sm font-medium leading-relaxed line-clamp-2">{c.message}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground/70">{c.author}</span> in{' '}
                      <span className="font-mono text-primary/80">{c.repo}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-secondary px-2 py-0.5 rounded">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

