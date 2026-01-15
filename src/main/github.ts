import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

export interface GitHubStats {
  user: any

  runs: any[]

  prs: any[]

  alerts: any[]

  commits: any[]

  repos: any[]
  totalStars: number
  totalIssues: number
  totalRepos: number
}

export class GitHubManager {
  private resolvedGhPath: string | null = null

  private async getGhPath(): Promise<string> {
    if (this.resolvedGhPath) return this.resolvedGhPath

    // 1. Try global 'gh'
    try {
      await execAsync('gh --version')
      this.resolvedGhPath = 'gh'
      return 'gh'
    } catch {
      // 2. Try common locations
      const commonPaths = [
        'C:\\Program Files\\GitHub CLI\\gh.exe',
        'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
        '/usr/local/bin/gh',
        '/opt/homebrew/bin/gh',
        '/usr/bin/gh'
      ]

      for (const p of commonPaths) {
        if (existsSync(p)) {
          this.resolvedGhPath = `"${p}"`
          return this.resolvedGhPath
        }
      }
    }

    this.resolvedGhPath = 'gh' // default fallback
    return 'gh'
  }

  async checkVersion(): Promise<boolean> {
    try {
      const gh = await this.getGhPath()
      await execAsync(`${gh} --version`)
      return true
    } catch {
      return false
    }
  }

  async install(): Promise<void> {
    if (process.platform === 'win32') {
      try {
        await execAsync(
          'winget install GitHub.cli --accept-source-agreements --accept-package-agreements'
        )
      } catch (e) {
        console.error('Winget install failed', e)
        throw new Error('Automated installation failed. Please install GitHub CLI manually.')
      }
    } else {
      throw new Error('Automatic installation is only supported on Windows for now.')
    }
  }

  async isLogged(): Promise<boolean> {
    try {
      const gh = await this.getGhPath()
      await execAsync(`${gh} auth status`)
      return true
    } catch {
      return false
    }
  }

  async login(): Promise<void> {
    const gh = await this.getGhPath()
    // Strip quotes if they exist because spawn doesn't like them in the command argument if shell is false
    // but with shell: true it should be fine.
    const child = spawn(gh, ['auth', 'login', '--web'], { stdio: 'ignore', shell: true })

    return new Promise((resolve, reject) => {
      child.on('error', reject)
      setTimeout(resolve, 2000)
    })
  }

  async listRepos(limit: number = 30): Promise<any[]> {
    const gh = await this.getGhPath()
    const { stdout } = await execAsync(
      `${gh} repo list --json name,nameWithOwner,description,url,stargazerCount,updatedAt,visibility,primaryLanguage --limit ${limit}`
    )
    return JSON.parse(stdout)
  }

  async getDashboardStats(): Promise<GitHubStats> {
    const gh = await this.getGhPath()

    // 1. Fetch User Info, Repos Sample (for stars/listing), and Total Count
    // We fetch 100 repos to get a more accurate star count without too much overhead
    const [userStdout, allRepos] = await Promise.all([
      execAsync(`${gh} api user`).then((r) => r.stdout),
      this.listRepos(100)
    ])

    const userRaw = JSON.parse(userStdout)
    const user = {
      ...userRaw,
      public_repos: Number(userRaw.public_repos) || 0,
      total_private_repos: Number(userRaw.total_private_repos || userRaw.owned_private_repos) || 0
    }

    // Calculate total repos from user data for accuracy
    const totalRepos = user.public_repos + user.total_private_repos

    // Get top 5 repos for the dashboard display
    const repos = allRepos.slice(0, 5)

    // Sum stars from the fetched repos (up to 100)
    const totalStars = allRepos.reduce((acc, r) => acc + (r.stargazerCount || 0), 0)

    const stats: GitHubStats = {
      user: user,
      runs: [],
      prs: [],
      alerts: [],
      commits: [],
      repos: repos,
      totalStars,
      totalIssues: 0,
      totalRepos
    }

    // 2. Fetch specific items in parallel
    const runPromises = repos.slice(0, 3).map(async (repo) => {
      try {
        const { stdout } = await execAsync(
          `${gh} run list -R ${repo.nameWithOwner} --limit 1 --json status,conclusion,workflowName,createdAt,url`
        )
        const runs = JSON.parse(stdout)
        return runs.map((r) => ({ ...r, repo: repo.name }))
      } catch {
        return []
      }
    })

    const prPromise = (async () => {
      try {
        // Search for PRs where the user is involved (created, assigned, or mentioned)
        const { stdout } = await execAsync(
          `${gh} search prs --involves=@me --state=open --limit 10 --json title,repository,url,createdAt`
        )
        return JSON.parse(stdout)
      } catch {
        return []
      }
    })()

    const issuesPromise = (async () => {
      try {
        // Search for issues where the user is involved (created, assigned, or mentioned)
        const { stdout } = await execAsync(
          `${gh} search issues --involves=@me --state=open --json title,url`
        )
        const issues = JSON.parse(stdout)
        return issues.length
      } catch {
        return 0
      }
    })()

    const eventsPromise = (async () => {
      try {
        const [userEventsStdout, receivedEventsStdout] = await Promise.all([
          execAsync(`${gh} api "users/${user.login}/events/public?per_page=20"`).then(
            (r) => r.stdout
          ),
          execAsync(`${gh} api "users/${user.login}/received_events?per_page=20"`).then(
            (r) => r.stdout
          )
        ])

        const userEvents = JSON.parse(userEventsStdout)
        const receivedEvents = JSON.parse(receivedEventsStdout)

        const allEvents = [
          ...(Array.isArray(userEvents) ? userEvents : []),
          ...(Array.isArray(receivedEvents) ? receivedEvents : [])
        ]

        // Deduplicate by ID and sort by date
        const uniqueEvents = Array.from(new Map(allEvents.map((item) => [item.id, item])).values())

        return uniqueEvents
          .map((e) => {
            let message = ''
            const repoName = e.repo.name.split('/').pop() || e.repo.name

            switch (e.type) {
              case 'PushEvent':
                message =
                  e.payload.commits?.[0]?.message ||
                  `Pushed to ${e.payload.ref.replace('refs/heads/', '')}`
                break
              case 'PullRequestEvent':
                message = `${e.payload.action.charAt(0).toUpperCase() + e.payload.action.slice(1)} PR ${e.payload.pull_request.title || '#' + e.payload.pull_request.number}`
                break
              case 'IssuesEvent':
                message = `${e.payload.action.charAt(0).toUpperCase() + e.payload.action.slice(1)} Issue ${e.payload.issue.title || '#' + e.payload.issue.number}`
                break
              case 'CreateEvent':
                message = `Created ${e.payload.ref_type}${e.payload.ref ? ` ${e.payload.ref}` : ''}`
                break
              case 'DeleteEvent':
                message = `Deleted ${e.payload.ref_type} ${e.payload.ref}`
                break
              case 'WatchEvent':
                message = 'Starred repository'
                break
              default:
                message = e.type.replace('Event', '')
            }

            return {
              message,
              date: e.created_at,
              repo: repoName,
              author: e.actor.display_login || e.actor.login
            }
          })
          .filter((e) => e.message)
      } catch {
        return []
      }
    })()

    const alertsPromises = repos.slice(0, 3).map(async (repo) => {
      try {
        const { stdout } = await execAsync(
          `${gh} api repos/${repo.nameWithOwner}/dependabot/alerts --per_page 5`
        )
        const alerts = JSON.parse(stdout)
        if (!Array.isArray(alerts)) return []
        return alerts.map((a) => ({
          summary: a.security_advisory.summary,
          severity: a.security_advisory.severity,
          repo: repo.name,
          url: a.html_url
        }))
      } catch {
        return []
      }
    })

    const [runsResults, prs, events, alertsResults, totalIssues] = await Promise.all([
      Promise.all(runPromises),
      prPromise,
      eventsPromise,
      Promise.all(alertsPromises),
      issuesPromise
    ])

    stats.runs = runsResults.flat()
    stats.prs = prs
    stats.totalIssues = totalIssues
    stats.commits = events
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
    stats.alerts = alertsResults.flat()

    return stats
  }
}
