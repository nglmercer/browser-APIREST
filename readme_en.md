# YouTube Control REST API 
- [Documentation](README_en.md)
- [Documentación (es)](README.md)

This document describes the available API routes in the project to control the YouTube application.

## Main Properties

- `mainWindow`: Reference to the main Electron window
- `store`: JSONStore instance to handle shortlinks (stored in `data.json`)

## Available Endpoints

### 1. Basic Navigation

**GET /navigate**
- Parameters:
  - `url`: Complete URL to load
- Example: `/navigate?url=https://www.google.com`

**GET /navigate/*
- Loads any URL after the `/navigate/` prefix
- Automatically adds `https://` if not present
- Example: `/navigate/www.google.com`

### 2. Shortlinks

**GET /shortlink/:name**
- Parameters:
  - `:name`: Shortlink name
  - Additional parameters to replace in the URL
- Example: `/shortlink/youtube?id=dQw4w9WgXcQ`

**POST /shortlink**
- Body (JSON):
  - `name`: New shortlink name
  - `url`: URL with parameters (e.g. `https://example.com/:id`)

### 3. YouTube

**GET /youtube/:id**
- Directly loads a YouTube video
- Example: `/youtube/dQw4w9WgXcQ`

### 4. Keyboard Control

**GET /key/:key**
- Sends a key press
- Example: `/key/Space` (play/pause)

**GET /keys**
- Returns list of available keys

## Usage Example

```javascript
// Example using fetch
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

## Configuration

The API server runs on `http://localhost:3001`