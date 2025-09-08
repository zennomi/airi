import { dirname, join } from 'node:path'
import { env, platform } from 'node:process'
import { fileURLToPath } from 'node:url'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import { app, BrowserWindow, shell } from 'electron'
import { isMacOS } from 'std-env'

import icon from '../../resources/icon.png?asset'

setGlobalFormat(Format.Pretty)
setGlobalLogLevel(LogLevel.Log)

if (/^true$/i.test(env.APP_REMOTE_DEBUG || '')) {
  const remoteDebugPort = Number(env.APP_REMOTE_DEBUG_PORT || '9222')
  if (Number.isNaN(remoteDebugPort) || !Number.isInteger(remoteDebugPort) || remoteDebugPort < 0 || remoteDebugPort > 65535) {
    throw new Error(`Invalid remote debug port: ${env.APP_REMOTE_DEBUG_PORT}`)
  }

  app.commandLine.appendSwitch('remote-debugging-port', String(remoteDebugPort))
  app.commandLine.appendSwitch('remote-allow-origins', `http://localhost:${remoteDebugPort}`)
}

app.dock?.setIcon(icon)

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 450.0,
    height: 600.0,
    show: false,
    icon,
    webPreferences: {
      preload: join(dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
      sandbox: false,
    },
    frame: false,
    titleBarStyle: isMacOS ? 'hidden' : undefined,
    transparent: true,
    hasShadow: false,
  })

  mainWindow.setAlwaysOnTop(true)
  mainWindow.setWindowButtonVisibility(false)
  mainWindow.on('ready-to-show', () => mainWindow!.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('ai.moeru.airi')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
