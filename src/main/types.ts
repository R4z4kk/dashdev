export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  public_repos: number
  total_private_repos: number
  followers: number
  following: number
  html_url: string
}

export interface GitHubRepo {
  name: string
  nameWithOwner: string
  description: string | null
  url: string
  stargazerCount: number
  updatedAt: string
  visibility: string
  primaryLanguage: {
    name: string
  } | null
}

export interface GitHubWorkflowRun {
  status: string
  conclusion: string | null
  workflowName: string
  createdAt: string
  url: string
  repo: string
}

export interface GitHubPullRequest {
  title: string
  repository: {
    nameWithOwner: string
  }
  url: string
  createdAt: string
}

export interface GitHubAlert {
  summary: string
  severity: string
  repo: string
  url: string
}

export interface GitHubCommit {
  message: string
  date: string
  repo: string
  author: string
}

export interface GitHubStats {
  user: GitHubUser
  runs: GitHubWorkflowRun[]
  prs: GitHubPullRequest[]
  alerts: GitHubAlert[]
  commits: GitHubCommit[]
  repos: GitHubRepo[]
  totalStars: number
  totalIssues: number
  totalRepos: number
}

export interface NetworkInterface {
  name: string
  address: string
  family: string
  mac: string
  internal: boolean
  subnet: string
}

export interface ScanResult {
  host: string
  port: number
  status: string
  banner?: string
}
