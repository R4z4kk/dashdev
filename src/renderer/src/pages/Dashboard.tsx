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
  ExternalLink,
  Users,
  Database,
  Search
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { GitHubAuth } from '../components/GitHubAuth'
import { motion } from 'framer-motion'
import {
  GitHubStats,
  GitHubWorkflowRun,
  GitHubPullRequest,
  GitHubAlert,
  GitHubCommit
} from '../../../main/types'

export function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<GitHubStats | null>(null)
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
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-in fade-in duration-500">
        <GitHubAuth onStatusChange={(user) => setIsAuthenticated(!!user)} />
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium">Aggregating your GitHub workspace...</p>
      </div>
    )
  }

  // Derived Data
  const { recentCommits, prs, runs, alerts, totalStars, totalIssues, totalRepos } = {
    recentCommits: stats?.commits || [],
    prs: stats?.prs || [],
    runs: stats?.runs || [],
    alerts: stats?.alerts || [],
    totalStars: stats?.totalStars || 0,
    totalIssues: stats?.totalIssues || 0,
    totalRepos: stats?.totalRepos || 0
  }

  const kpis = [
    {
      label: 'Repositories',
      value: totalRepos,
      icon: Database,
      color: 'text-blue-500'
    },
    { label: 'Total Stars', value: totalStars, icon: Star, color: 'text-yellow-500' },
    { label: 'Open Issues', value: totalIssues, icon: Search, color: 'text-emerald-500' },
    { label: 'Pending PRs', value: prs.length, icon: GitPullRequest, color: 'text-orange-500' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your GitHub ecosystem and active maintenance tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="gap-2"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{' '}
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            CONNECTED
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none bg-secondary/30 shadow-none">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-background ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6">
        {/* ACTION REQUIRED */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1">
            <Activity className="w-5 h-5 text-primary" /> Action Required
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* CI/CD Status */}
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Workflow Health
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {runs.length === 0 && (
                  <p className="text-xs italic text-muted-foreground">Monitoring 0 failing runs.</p>
                )}
                {runs.map((run: GitHubWorkflowRun) => (
                  <div key={run.url} className="flex items-center justify-between text-xs group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {run.conclusion === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : run.conclusion === 'failure' ? (
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      )}
                      <span className="truncate font-medium opacity-90">
                        {run.repo}: {run.workflowName}
                      </span>
                    </div>
                    <a
                      href={run.url}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* PR Requested */}
            <Card className="shadow-sm border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Review Requested
                  <GitPullRequest className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {prs.length === 0 && (
                  <p className="text-xs italic text-muted-foreground">You are all caught up!</p>
                )}
                {prs.map((pr: GitHubPullRequest) => (
                  <div
                    key={pr.url}
                    className="text-xs truncate text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline"
                    >
                      • {pr.title}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Vulnerabilities (Dependabot)
                  <AlertOctagon className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length === 0 && (
                  <p className="text-xs italic text-muted-foreground">
                    All repositories are secure.
                  </p>
                )}
                {alerts.slice(0, 4).map((alert: GitHubAlert, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs flex flex-col gap-0.5 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-red-500 text-white'
                            : 'bg-orange-500/10 text-orange-600'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{alert.repo}</span>
                    </div>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline text-foreground/80 leading-snug"
                    >
                      {alert.summary}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ACTIVITY STREAM */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1 pt-4">
            <Activity className="w-5 h-5 text-primary" /> Activity Stream
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {recentCommits.map((c: GitHubCommit, i: number) => (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-start gap-4 hover:bg-secondary/5 transition-colors"
                  >
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{c.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded italic">
                          {c.repo}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> {c.author}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-secondary px-2 py-1 rounded-md">
                      {new Date(c.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
