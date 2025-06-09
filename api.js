import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'
import { cors } from '@elysiajs/cors'
import JSONStore from './store.js'
import navigationRoutes from './routes/navigation.js';
import mediaKeyRoutes from './routes/mediaKeys.js';
import shortlinksAdminRoutes from './routes/shortlinksAdmin.js';
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
    .use(navigationRoutes(mainWindow, store))
    .use(mediaKeyRoutes(mainWindow))
    .use(shortlinksAdminRoutes(store))
    
    
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