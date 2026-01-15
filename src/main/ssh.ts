import { app } from 'electron'
import { mkdir, readFile, chmod, unlink, readdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class SSHManager {
  private keyDir: string

  constructor() {
    this.keyDir = join(app.getPath('userData'), '.ssh')
  }

  async init(): Promise<void> {
    try {
      await mkdir(this.keyDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create SSH dir', error)
    }
  }

  async generateKey(name: string, email: string): Promise<{ publicKey: string; path: string }> {
    const keyPath = join(this.keyDir, name).replace(/\\/g, '/')
    // -t ed25519: modern algorithm
    // -C: comment (email)
    // -f: output file
    // -N: empty passphrase
    // -q: quiet
    const command = `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`

    try {
      await execAsync(command)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('ssh-keygen failed:', message)
      throw new Error(`Failed to generate SSH key: ${message}`)
    }

    // Set permissions strictly
    const localKeyPath = join(this.keyDir, name)
    await chmod(localKeyPath, 0o600)
    await chmod(`${localKeyPath}.pub`, 0o644)

    const publicKey = await readFile(`${localKeyPath}.pub`, 'utf-8')

    return {
      publicKey,
      path: localKeyPath
    }
  }

  async getPublicKey(name: string): Promise<string> {
    try {
      const keyPath = join(this.keyDir, `${name}.pub`)
      return await readFile(keyPath, 'utf-8')
    } catch {
      throw new Error('Key not found')
    }
  }

  async deleteKey(name: string): Promise<void> {
    try {
      const keyPath = join(this.keyDir, name)
      await unlink(keyPath).catch(() => {})
      await unlink(`${keyPath}.pub`).catch(() => {})
    } catch (error) {
      console.error('Delete failed', error)
      throw error
    }
  }

  async listKeys(): Promise<string[]> {
    try {
      const files = await readdir(this.keyDir)
      // Filter out .pub files, showing only private keys (the pairs)
      return files.filter((f: string) => !f.endsWith('.pub'))
    } catch {
      return []
    }
  }
  async execCommand(
    host: string,
    port: string,
    username: string,
    keyName: string,
    command: string
  ): Promise<string> {
    const keyPath = join(this.keyDir, keyName).replace(/\\/g, '/')

    // Safety check for key existence
    try {
      await readFile(keyPath)
    } catch {
      throw new Error(`Private key "${keyName}" not found.`)
    }

    // Construct SSH command
    // -o StrictHostKeyChecking=no: Auto-accept host keys (dev mode convenience)
    // -o BatchMode=yes: Disable interaction (password prompts etc)
    // -o ConnectTimeout=10: Fail fast if network is down
    const sshCmd = `ssh -i "${keyPath}" -p ${port} -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10 ${username}@${host} "${command.replace(
      /"/g,
      '\\"'
    )}"`

    try {
      const { stdout, stderr } = await execAsync(sshCmd)
      return stdout || stderr
    } catch (error: unknown) {
      // Return stderr/message if it fails, so frontend sees the error output
      const err = error as { stderr?: string; message?: string }
      return err.stderr || err.message || 'Unknown error'
    }
  }

  async copyToRemote(
    host: string,
    port: string,
    username: string,
    keyName: string,
    localPath: string,
    remotePath: string
  ): Promise<void> {
    const keyPath = join(this.keyDir, keyName).replace(/\\/g, '/')

    // Safety check for key existence
    try {
      await readFile(keyPath)
    } catch {
      throw new Error(`Private key "${keyName}" not found.`)
    }

    // specific scp options
    // -r: recursive
    const scpCmd = `scp -i "${keyPath}" -P ${port} -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10 -r "${localPath}" ${username}@${host}:"${remotePath}"`

    try {
      await execAsync(scpCmd)
    } catch (error: unknown) {
      const err = error as { stderr?: string; message?: string }
      throw new Error(`SCP failed: ${err.stderr || err.message || 'Unknown error'}`)
    }
  }
}
