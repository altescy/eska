import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// Expose safeStorage API
contextBridge.exposeInMainWorld('safeStorage', {
  isEncryptionAvailable: () => ipcRenderer.invoke('safeStorage:isEncryptionAvailable'),
  encryptString: (plainText: string) => ipcRenderer.invoke('safeStorage:encryptString', plainText),
  decryptString: (encrypted: string) => ipcRenderer.invoke('safeStorage:decryptString', encrypted),
})

// Expose portForward API
contextBridge.exposeInMainWorld('portForward', {
  start: (clusterId: string, config: any) => ipcRenderer.invoke('port-forward:start', clusterId, config),
  stop: (clusterId: string) => ipcRenderer.invoke('port-forward:stop', clusterId),
  getStatus: (clusterId: string) => ipcRenderer.invoke('port-forward:status', clusterId),
  getAllStatuses: () => ipcRenderer.invoke('port-forward:all-statuses'),
  onStatusChange: (callback: (status: any) => void) => {
    const listener = (_event: any, status: any) => callback(status)
    ipcRenderer.on('port-forward:status', listener)
    return () => {
      ipcRenderer.removeListener('port-forward:status', listener)
    }
  },
})
