import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ssh: {
    generate: (name: string, email: string) => ipcRenderer.invoke('ssh:generate', name, email),
    list: () => ipcRenderer.invoke('ssh:list'),
    getPublicKey: (name: string) => ipcRenderer.invoke('ssh:getPublicKey', name),
    delete: (name: string) => ipcRenderer.invoke('ssh:delete', name),
    exec: (host: string, port: string, username: string, keyName: string, command: string) =>
      ipcRenderer.invoke('ssh:exec', host, port, username, keyName, command)
  },
  network: {
    scan: (target?: string) => ipcRenderer.invoke('network:scan', target),
    getInterfaces: () => ipcRenderer.invoke('network:getInterfaces')
  },
  github: {
    listRepos: (limit?: number) => ipcRenderer.invoke('github:repos', limit),
    checkVersion: () => ipcRenderer.invoke('github:checkVersion'),
    install: () => ipcRenderer.invoke('github:install'),
    isLogged: () => ipcRenderer.invoke('github:isLogged'),
    login: () => ipcRenderer.invoke('github:login'),
    stats: () => ipcRenderer.invoke('github:stats')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
