import { Elysia } from 'elysia';

export default (store) => {
  const app = new Elysia()
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
    });
  return app;
};
