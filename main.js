import { app, BrowserWindow, ipcMain, session } from 'electron'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import path from 'path'
import { setupAPI } from './api.js'
const __dirname = path.dirname(new URL(import.meta.url).pathname)
let mainWindow

async function createWindow() {
  // Configurar el bloqueador de anuncios
  const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
  blocker.enableBlockingInSession(session.defaultSession)

  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Iniciar el servidor API
  setupAPI(mainWindow)


  // Cargar el archivo HTML
  mainWindow.loadURL('https://www.youtube.com/')

  // Abrir las herramientas de desarrollo
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})