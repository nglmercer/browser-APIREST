import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'
import { cors } from '@elysiajs/cors'
import JSONStore from './store.js'
let mainWindow = null
const store = new JSONStore('data.json', true)

// Configuración inicial de shortlinks
try {
  if (!store.has('shortlinks')) {
    store.set('shortlinks', {
      youtube: 'https://www.youtube.com/watch?v=:id'
    })
  }
} catch (error) {
  console.error('Error inicializando shortlinks:', error.message)
}

function setupAPI(window) {
  mainWindow = window
  
  const app = new Elysia({ adapter: node() })
    .use(    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),)
    
    // Ruta para navegación básica
    .get('/navigate', ({ query }) => {
      if (query.url && mainWindow) {
        mainWindow.loadURL(query.url)
        return { success: true }
      }
      return { success: false }
    })
    .get('/navigate/*', (req) => {
      if (mainWindow) {
        // Extract the full URL from the request URL by removing the '/navigate/' prefix
        let fullUrl = req.url.replace('/navigate/', '');
        console.log('Parámetros de la URL:', { '*': fullUrl }, req.url);        
        // Add https protocol if not present
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          fullUrl = 'https://' + fullUrl;
        }
        
        mainWindow.loadURL(fullUrl);
        console.log('Cargando URL:', fullUrl);
        return { success: true, url: fullUrl };
      }
      return { success: false };
    })
    // Ruta para manejar shortlinks
    .get('/shortlink/:name', ({ params: { name }, query }) => {
      const shortlinks = store.get('shortlinks')
      if (shortlinks && shortlinks[name]) {
        let url = shortlinks[name]
        
        // Reemplazar parámetros en la URL
        for (const key in query) {
          url = url.replace(`:${key}`, query[key])
        }
        
        if (mainWindow) {
          mainWindow.loadURL(url)
          return { success: true, url }
        }
      }
      return { success: false }
    })
    
    // Ruta para manejar IDs de video de YouTube
    .get('/youtube/:id', ({ params: { id } }) => {
      const url = `https://www.youtube.com/watch?v=${id}`
      if (mainWindow) {
        mainWindow.loadURL(url)
        return { success: true, url }
      }
      return { success: false }
    })
    .get('/key/:key', ({ params: { key } }) => {
      if (mainWindow) {

        mainWindow.webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: key
        });
        mainWindow.webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: key
        });
        return { success: true }
      }
      return { success: false }
    })
    .get('/keys', () => {
      return {
        "MediaPlayPause": "MediaPlayPause",
        "MediaStop": "MediaStop",
        "MediaNextTrack": "MediaNextTrack",
        "MediaPreviousTrack": "MediaPreviousTrack",
        "VolumeUp": "VolumeUp",
        "VolumeDown": "VolumeDown",
        "VolumeMute": "VolumeMute",
        "f": "f",
        "play_pause": "Space",
        "stop": "MediaStop",
        "next_track": "MediaNextTrack",
        "prev_track": "MediaPreviousTrack",
        "volume_up": "VolumeUp",
        "volume_down": "VolumeDown",
        "mute": "VolumeMute",
        "fullscreen": "f",
      }
    })
    // Ruta para administrar shortlinks
    .post('/shortlink', ({ body }) => {
      try {
        const { name, url } = body
        const shortlinks = store.get('shortlinks') || {}
        shortlinks[name] = url
        store.set('shortlinks', shortlinks)
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })
    
    
    const ports = [3001, 3002, 3003, 0]
    
    for (const port of ports) {
      try {
        app.listen(port)
        console.log(`API server running at http://localhost:${port}`)
        return
      } catch (error) {
        console.log(`Puerto ${port} no disponible, probando siguiente...`)
      }
    }
    
    console.error('No se pudo iniciar el servidor en ningún puerto disponible')
}

export { setupAPI }