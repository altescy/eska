import { app, BrowserWindow, ipcMain, safeStorage } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PortForwardManager } from './portForwardManager.js'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
const portForwardManager = new PortForwardManager()

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.png'),
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'fullscreen-ui',
    backgroundMaterial: 'acrylic',
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Set up IPC handlers for safeStorage
ipcMain.handle('safeStorage:isEncryptionAvailable', () => {
  return safeStorage.isEncryptionAvailable()
})

ipcMain.handle('safeStorage:encryptString', (_event, plainText: string) => {
  const buffer = safeStorage.encryptString(plainText)
  return buffer.toString('base64')
})

ipcMain.handle('safeStorage:decryptString', (_event, encrypted: string) => {
  const buffer = Buffer.from(encrypted, 'base64')
  return safeStorage.decryptString(buffer)
})

// Set up port forward status listener
portForwardManager.on('status', (status) => {
  win?.webContents.send('port-forward:status', status)
})

// Port forward IPC handlers
ipcMain.handle('port-forward:start', async (_event, clusterId: string, config: any) => {
  return await portForwardManager.start(clusterId, config)
})

ipcMain.handle('port-forward:stop', async (_event, clusterId: string) => {
  await portForwardManager.stop(clusterId)
})

ipcMain.handle('port-forward:status', async (_event, clusterId: string) => {
  return portForwardManager.getStatus(clusterId)
})

ipcMain.handle('port-forward:all-statuses', async () => {
  return portForwardManager.getAllStatuses()
})

// Stop all port forwards before app quits
app.on('before-quit', async () => {
  await portForwardManager.stopAll()
})

app.whenReady().then(createWindow)
