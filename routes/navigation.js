import { Elysia } from 'elysia';

export default (mainWindow, store) => {
  const app = new Elysia()
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
    });
  return app;
};
