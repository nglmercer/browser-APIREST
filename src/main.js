import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

// Try to import the ad blocker, but don't fail if it's not available
let ElectronBlocker = null
try {
  const adblockerModule = await import('@ghostery/adblocker-electron')
  ElectronBlocker = adblockerModule.ElectronBlocker
} catch (error) {
  console.warn('Ad blocker not available:', error.message)
}

// Try to import the API setup
let setupAPI = null
try {
  const apiModule = await import('./api.js')
  setupAPI = apiModule.setupAPI
} catch (error) {
  console.warn('API setup not available:', error.message)
}

// Obtener __dirname correctamente en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

async function createWindow() {
  // Configurar el bloqueador de anuncios (opcional)
  if (ElectronBlocker) {
    try {
      const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
      blocker.enableBlockingInSession(session.defaultSession)
      console.log('Ad blocker initialized successfully')
    } catch (error) {
      console.error('Error initializing ad blocker:', error)
    }
  } else {
    console.log('Ad blocker not available, continuing without it')
  }

  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true, // IMPORTANTE: cambio a true para seguridad
      enableRemoteModule: false,
      webSecurity: false, // Solo para desarrollo, cambiar a true en producción
      sandbox: false,
    }
  })

  // Verificar que el archivo preload existe
  console.log('Preload path:', path.join(__dirname, 'preload.js'))
  
  // Iniciar el servidor API (opcional)
  if (setupAPI) {
    try {
      setupAPI(mainWindow)
      console.log('API server started')
    } catch (error) {
      console.error('Error starting API server:', error)
    }
  } else {
    console.log('API setup not available, continuing without it')
  }

  // Cargar la URL
  await mainWindow.loadURL('https://www.youtube.com/')

  // Abrir las herramientas de desarrollo
  mainWindow.webContents.openDevTools()

  // Verificar que el preload se cargó
  mainWindow.webContents.once('dom-ready', () => {
    console.log('DOM ready - checking if preload loaded')
    mainWindow.webContents.executeJavaScript(`
      console.log('Checking electronAPI:', window.electronAPI);
      return !!window.electronAPI;
    `).then(hasAPI => {
      console.log('ElectronAPI available:', hasAPI)
      if (hasAPI) {
        // Probar la API
        mainWindow.webContents.executeJavaScript(`
          window.electronAPI.test()
        `).then(result => {
          console.log('API test result:', result)
        }).catch(err => {
          console.error('API test error:', err)
        })
      }
    }).catch(err => {
      console.error('Error checking API:', err)
    })
  })

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Manejar navegación
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('Navigated to:', url)
  })
}

// Handlers para IPC
ipcMain.on('ping', (event) => {
  console.log('Ping received from renderer')
  event.reply('pong', 'Pong from main process')
})

ipcMain.on('media-event', (event, data) => {
  console.log('Media event received:', {
    type: data.type,
    url: data.url,
    timestamp: new Date(data.timestamp).toLocaleString(),
    hasData: !!data.data
  })
  
  // Aquí puedes procesar los eventos de media como necesites
  // Por ejemplo, guardar en base de datos, enviar a API, etc.
})

ipcMain.on('media-data', (event, data) => {
  console.log('Media data received:', data)
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Permitir certificados no válidos solo para desarrollo
app.commandLine.appendSwitch('--ignore-ssl-errors')
app.commandLine.appendSwitch('--ignore-certificate-errors')
app.commandLine.appendSwitch('--disable-web-security')

console.log('Main process started')