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
        scan: () => Promise<any[]>
      }
      github: {
        listRepos: (limit?: number) => Promise<any[]>
        checkVersion: () => Promise<boolean>
        install: () => Promise<void>
        isLogged: () => Promise<boolean>
        login: () => Promise<void>
        stats: () => Promise<any>
      }
    }
  }
}
