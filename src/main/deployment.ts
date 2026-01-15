import { app } from 'electron'
import { join } from 'path'
import { mkdir, rm, writeFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { SSHManager } from './ssh'

const execAsync = promisify(exec)

export interface DeploymentConfig {
  repoName: string // owner/repo
  server: {
    host: string
    port: string
    username: string
    keyName: string
  }
  command?: string
  environment?: string
}

export class DeploymentManager {
  private ssh: SSHManager

  constructor() {
    this.ssh = new SSHManager()
    this.ssh.init()
  }

  async deploy(config: DeploymentConfig): Promise<string> {
    const { repoName, server, environment } = config
    const launchCommand = config.command || 'docker compose up -d'
    const shortName = repoName.split('/').pop() || 'app'

    // Create temp directory for cloning
    const tempDir = join(app.getPath('temp'), 'dashdev-deploy', shortName + '-' + Date.now())
    await mkdir(tempDir, { recursive: true })

    try {
      // 1. Clone Repository
      console.log(`Cloning ${repoName} to ${tempDir}...`)
      // We use GitHubManager's helper or just raw command since we need specific logic
      // Assuming 'gh' is available as GitHubManager ensures it
      // Accessing private method via cast or I should make it public.
      // Better to just use 'gh' if we assume it's in path, or use GitHubManager public methods?
      // GitHubManager doesn't expose getGhPath. I'll just rely on system 'gh' or try checking version.
      // Actually GitHubManager checks paths. I should probably expose getGhPath or duplicate logic.
      // For now I'll use 'gh' and rely on the fact that GitHubManager.checkVersion() would have been called.
      // But to be safe, I'll copy the resolution logic or just try 'gh'.

      // Clone
      await execAsync(`gh repo clone ${repoName} "${tempDir}"`)

      // 2. Fetch Environment Variables
      console.log('Fetching environment variables...')
      const allVars: Record<string, string> = {}

      const fetchVars = async (cmd: string): Promise<void> => {
        try {
          const { stdout } = await execAsync(cmd, { cwd: tempDir })
          const variables = JSON.parse(stdout)
          if (Array.isArray(variables)) {
            variables.forEach((v: { name: string; value: string }) => {
              allVars[v.name] = v.value
            })
          }
        } catch (e: unknown) {
          const errorMsg = e instanceof Error ? e.message : String(e)
          console.warn(`Failed to fetch variables via ${cmd}:`, errorMsg)
        }
      }

      // Fetch repo vars
      await fetchVars(`gh variable list -R ${repoName} --json name,value`)

      // Fetch env vars if specified
      if (environment) {
        await fetchVars(`gh variable list -R ${repoName} -e ${environment} --json name,value`)
      }

      const envContent = Object.entries(allVars)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')

      if (envContent) {
        await writeFile(join(tempDir, '.env'), envContent)
      }

      // 3. Prepare Remote Directory
      const remoteDir = `deployments/${shortName}`
      // We assume relative to user home if not absolute.
      // Safest is to use absolute path if we knew home, but `mkdir -p deployments/...` works in home.

      console.log(`Preparing remote directory ${remoteDir}...`)
      await this.ssh.execCommand(
        server.host,
        server.port,
        server.username,
        server.keyName,
        `mkdir -p "${remoteDir}"`
      )

      // 4. Transfer Files
      console.log('Transferring files...')
      // We transfer the CONTENTS of tempDir to remoteDir
      // scp -r tempDir/* ... is hard with globbing in command.
      // Easier to scp the folder itself, but we want it IN remoteDir.
      // If we scp tempDir to remoteDir, we get remoteDir/tempDirName/...
      // So we should scp tempDir/* to remoteDir/
      // standard scp implementation in ssh.ts takes simple paths.
      // Let's use wildcard if possible? localPath with * might work if shell expands it.
      // modifying ssh.ts to support wildcard might be risky.
      // Alternative: scp the DIRECTORY itself to `deployments/`, renaming it?
      // scp -r localDir user@host:remoteParent
      // results in remoteParent/localDirName
      // So if we rename tempDir to 'shortName' locally (it is somewhat named that but with timestamp),
      // Actually we can just transfer `tempDir` to `deployments/` and then rename or move contents.
      // OR: `scp -r tempDir/*` doesn't always work if no shell expansion locally.
      // Simplest: `scp -r ${tempDir}/. ${server}:${remoteDir}` works with some scp versions to copy contents.
      // safely: Transfer `tempDir` to `deployments/tmp-${timestamp}` then move contents to `deployments/${shortName}`.

      // Let's try to just use the new copyToRemote which does `scp -r local remote`.
      // If I pass `tempDir` (path/to/repo-timestamp) and remote `deployments/${shortName}`,
      // scp will copy `repo-timestamp` INTO `deployments/${shortName}` -> `deployments/${shortName}/repo-timestamp`.
      // Unless `deployments/${shortName}` does not exist?
      // If I want contents:
      // 1. Create `deployments` folder.
      // 2. Transfer `tempDir` to `deployments/`. Remote has `deployments/repo-timestamp`.
      // 3. Rename/Move `deployments/repo-timestamp` to `deployments/${shortName}` (replacing or merging?).
      // User probably wants to replace.

      // Refined strategy:
      // 1. Ensure `deployments` exists.
      // 2. scp `tempDir` to `deployments/`.
      // 3. On remote: `rm -rf deployments/${shortName} && mv deployments/${basename(tempDir)} deployments/${shortName}`

      const tempDirName = tempDir.split(/[/\\]/).pop()! // repo-timestamp
      await this.ssh.execCommand(
        server.host,
        server.port,
        server.username,
        server.keyName,
        `mkdir -p deployments`
      )

      await this.ssh.copyToRemote(
        server.host,
        server.port,
        server.username,
        server.keyName,
        tempDir,
        'deployments/' // parent dir
      )

      // Swap folders
      const swapCmd = `rm -rf "deployments/${shortName}" && mv "deployments/${tempDirName}" "deployments/${shortName}"`
      await this.ssh.execCommand(server.host, server.port, server.username, server.keyName, swapCmd)

      // 5. Execute Launch Command
      console.log('Executing launch command...')
      const deployCmd = `cd "deployments/${shortName}" && ${launchCommand}`
      const result = await this.ssh.execCommand(
        server.host,
        server.port,
        server.username,
        server.keyName,
        deployCmd
      )

      return result
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Deployment failed', errorMsg)
      throw new Error(`Deployment failed: ${errorMsg}`)
    } finally {
      // Cleanup temp
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
