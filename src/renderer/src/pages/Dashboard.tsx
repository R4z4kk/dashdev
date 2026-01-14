import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Activity, GitPullRequest, AlertOctagon, CheckCircle, XCircle, Clock } from 'lucide-react'
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
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading dashboard metrics...
      </div>
    )
  }

  // Derived Data
  const recentCommits = stats.commits || []
  const prs = stats.prs || []
  const runs = stats.runs || []
  const alerts = stats.alerts || []

  // Transform data for charts if needed
  // For 'Ratio PR Ouvertes' vs 'Fermees' - we only have 'open' ones from the query plan?
  // Actually we only fetched "open review requested".
  // Let's use simple activity for now.

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          GitHub Connected
        </div>
      </div>

      {/* SECTION 1: HEALTH & ACTIONABLE */}
      <h2 className="text-xl font-semibold tracking-tight border-b pb-2">Health & Urgencies</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* CI/CD Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-2">
              {runs.length === 0 && (
                <span className="text-xs text-muted-foreground">No recent runs.</span>
              )}
              {runs.map((run: any) => (
                <div key={run.url} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {run.conclusion === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : run.conclusion === 'failure' ? (
                      <XCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className="truncate w-32">{run.workflowName}</span>
                  </div>
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-50 hover:opacity-100 hover:underline"
                  >
                    {new Date(run.createdAt).toLocaleDateString()}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PR Blockers */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRs Pending Review</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prs.length}</div>
            <div className="space-y-2 mt-2">
              {prs.length === 0 && (
                <p className="text-xs text-muted-foreground">You are all caught up!</p>
              )}
              {prs.map((pr: any) => (
                <div
                  key={pr.url}
                  className="text-xs truncate text-muted-foreground hover:text-foreground"
                >
                  <a href={pr.url} target="_blank" rel="noreferrer">
                    • {pr.title}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Dependabot alerts on top repos</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: ACTIVITY */}
      <h2 className="text-xl font-semibold tracking-tight border-b pb-2 pt-4">Recent Activity</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Commits List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Latest Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCommits.map((c: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none line-clamp-1">{c.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.author} in <span className="font-mono">{c.repo}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.date).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta Stats Chart (Languages/Disk Usage - Mocked visual for now as logic is complex for aggregation) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
              Charts will populate as data accumulates
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
