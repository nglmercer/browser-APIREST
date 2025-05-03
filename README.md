# API REST para Control de YouTube

Este documento describe las rutas API disponibles en el proyecto para controlar la aplicación de YouTube.

## Propiedades Principales

- `mainWindow`: Referencia a la ventana principal de Electron
- `store`: Instancia de JSONStore para manejar shortlinks (almacenado en `data.json`)

## Endpoints Disponibles

### 1. Navegación Básica

**GET /navigate**
- Parámetros:
  - `url`: URL completa a cargar
- Ejemplo: `/navigate?url=https://www.google.com`

**GET /navigate/*
- Carga cualquier URL después del prefijo `/navigate/`
- Añade automáticamente `https://` si no está presente
- Ejemplo: `/navigate/www.google.com`

### 2. Shortlinks

**GET /shortlink/:name**
- Parámetros:
  - `:name`: Nombre del shortlink
  - Parámetros adicionales para reemplazar en la URL
- Ejemplo: `/shortlink/youtube?id=dQw4w9WgXcQ`

**POST /shortlink**
- Cuerpo (JSON):
  - `name`: Nombre del nuevo shortlink
  - `url`: URL con parámetros (ej: `https://example.com/:id`)

### 3. YouTube

**GET /youtube/:id**
- Carga directamente un video de YouTube
- Ejemplo: `/youtube/dQw4w9WgXcQ`

### 4. Control por Teclado

**GET /key/:key**
- Envía una pulsación de tecla
- Ejemplo: `/key/Space` (play/pause)

**GET /keys**
- Devuelve lista de teclas disponibles

## Ejemplo de Uso

```javascript
// Ejemplo usando fetch
fetch('http://localhost:3001/youtube/dQw4w9WgXcQ')
  .then(response => response.json())
  .then(data => console.log(data));

fetch('http://localhost:3001/key/Space')
  .then(response => response.json())
  .then(data => console.log(data));

fetch('http://localhost:3001/navigate?url=https://www.google.com')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Configuración

El servidor API se ejecuta en `http://localhost:3001`