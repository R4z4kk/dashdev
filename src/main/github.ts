import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

export interface GitHubStats {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alerts: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commits: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repos: any[]
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listRepos(limit: number = 30): Promise<any[]> {
    const gh = await this.getGhPath()
    const { stdout } = await execAsync(
      `${gh} repo list --json name,nameWithOwner,description,url,stargazerCount,updatedAt,visibility,primaryLanguage --limit ${limit}`
    )
    return JSON.parse(stdout)
  }

  async getDashboardStats(): Promise<GitHubStats> {
    const gh = await this.getGhPath()
    const repos = await this.listRepos(5)

    if (repos.length === 0) {
      return { runs: [], prs: [], alerts: [], commits: [], repos: [] }
    }

    const stats: GitHubStats = {
      runs: [],
      prs: [],
      alerts: [],
      commits: [],
      repos: repos
    }

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
        const { stdout } = await execAsync(
          `${gh} search prs --review-requested=@me --state=open --limit 5 --json title,repository,url,createdAt`
        )
        return JSON.parse(stdout)
      } catch {
        return []
      }
    })()

    const commitPromises = repos.slice(0, 3).map(async (repo) => {
      try {
        const { stdout } = await execAsync(`${gh} api repos/${repo.nameWithOwner}/commits --per_page 1`)
        const commits = JSON.parse(stdout)
        return commits.map((c) => ({
          message: c.commit.message,
          date: c.commit.author.date,
          repo: repo.name,
          author: c.commit.author.name
        }))
      } catch {
        return []
      }
    })

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

    const [runsResults, prs, commitsResults, alertsResults] = await Promise.all([
      Promise.all(runPromises),
      prPromise,
      Promise.all(commitPromises),
      Promise.all(alertsPromises)
    ])

    stats.runs = runsResults.flat()
    stats.prs = prs
    stats.commits = commitsResults
      .flat()
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    stats.alerts = alertsResults.flat()

    return stats
  }
}

