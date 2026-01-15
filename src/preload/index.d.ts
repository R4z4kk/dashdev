import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ssh: {
        generate: (name: string, email: string) => Promise<{ publicKey: string; path: string }>
        list: () => Promise<string[]>
        getPublicKey: (name: string) => Promise<string>
        delete: (name: string) => Promise<void>
        exec: (
          host: string,
          port: string,
          username: string,
          keyName: string,
          command: string
        ) => Promise<string>
      }
      network: {
        scan: (target?: string) => Promise<import('../main/types').ScanResult[]>
        getInterfaces: () => Promise<import('../main/types').NetworkInterface[]>
      }
      github: {
        listRepos: (limit?: number) => Promise<import('../main/types').GitHubRepo[]>
        checkVersion: () => Promise<boolean>
        install: () => Promise<void>
        isLogged: () => Promise<boolean>
        login: () => Promise<void>
        stats: () => Promise<import('../main/types').GitHubStats>
        getEnvironments: (repoName: string) => Promise<string[]>
      }
      deployment: {
        deploy: (config: {
          repoName: string
          server: {
            host: string
            port: string
            username: string
            keyName: string
          }
          command?: string
          environment?: string
        }) => Promise<string>
      }
    }
  }
}
