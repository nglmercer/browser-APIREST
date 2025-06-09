const { contextBridge, ipcRenderer } = require('electron')

if (!window.mediaTracker) {
  window.mediaTracker = {};
}

// 2. Generar ID único
function generateUniqueId() {
  return 'media_tracker_id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// 3. Limpiar trackers obsoletos
function cleanupObsoleteTrackers() {
  Object.keys(window.mediaTracker).forEach(id => {
    const tracker = window.mediaTracker[id];
    if (tracker.element && !document.contains(tracker.element)) {
      console.log('Cleaning up obsolete tracker:', id);
      delete window.mediaTracker[id];
    }
  });
}

// 4. Procesar elemento de media
function processMediaElement(element) {
  let elementId = element.id;
  if (!elementId || elementId.startsWith('media_tracker_id_')) {
    elementId = generateUniqueId();
    element.id = elementId;
    console.log('Generated new ID for media element:', elementId);
  }

  // Verificar si ya está procesado y el elemento aún existe
  if (window.mediaTracker[elementId] && document.contains(element)) {
    console.log('Media element already processed:', elementId);
    return;
  }

  console.log('Processing media element:', elementId, element);
  window.mediaTracker[elementId] = {
    isPlaying: false,
    percentage: 0,
    element: element,
    duration: 0,
    url: window.location.href,
    timestamp: Date.now()
  };

  // Remover listeners anteriores si existen
  element.removeEventListener('loadedmetadata', element._metadataHandler);
  element.removeEventListener('play', element._playHandler);
  element.removeEventListener('pause', element._pauseHandler);
  element.removeEventListener('ended', element._endedHandler);
  element.removeEventListener('timeupdate', element._timeupdateHandler);

  // Crear handlers y guardar referencias
  element._metadataHandler = function() {
    console.log('loadedmetadata for:', elementId, 'duration:', element.duration);
    if (window.mediaTracker[elementId]) {
      window.mediaTracker[elementId].duration = element.duration;
      
      const eventData = { 
        id: elementId, 
        duration: element.duration, 
        element: element,
        url: window.location.href
      };
      console.log('Dispatching mediaPlaybackMetadata for element:', elementId, eventData);
      document.dispatchEvent(new CustomEvent('mediaPlaybackMetadata', { detail: eventData }));
    }
  };

  element._playHandler = function() {
    console.log('play event for:', elementId);
    if (window.mediaTracker[elementId]) {
      window.mediaTracker[elementId].isPlaying = true;
      
      const eventData = { 
        id: elementId, 
        element: element,
        url: window.location.href
      };
      console.log('Dispatching mediaPlaybackStart for element:', elementId, eventData);
      document.dispatchEvent(new CustomEvent('mediaPlaybackStart', { detail: eventData }));
    }
  };

  element._pauseHandler = function() {
    console.log('pause event for:', elementId);
    if (window.mediaTracker[elementId]) {
      window.mediaTracker[elementId].isPlaying = false;
      
      const eventData = { 
        id: elementId, 
        percentage: window.mediaTracker[elementId].percentage, 
        element: element,
        url: window.location.href
      };
      console.log('Dispatching mediaPlaybackPause for element:', elementId, eventData);
      document.dispatchEvent(new CustomEvent('mediaPlaybackPause', { detail: eventData }));
    }
  };

  element._endedHandler = function() {
    console.log('ended event for:', elementId);
    if (window.mediaTracker[elementId]) {
      window.mediaTracker[elementId].isPlaying = false;
      window.mediaTracker[elementId].percentage = 100;
      
      const eventData = { 
        id: elementId, 
        element: element,
        url: window.location.href
      };
      console.log('Dispatching mediaPlaybackEnd for element:', elementId, eventData);
      document.dispatchEvent(new CustomEvent('mediaPlaybackEnd', { detail: eventData }));
    }
  };

  element._timeupdateHandler = function() {
    const trackerData = window.mediaTracker[elementId];
    if (!trackerData) return;
    
    if (trackerData.duration && typeof trackerData.duration === 'number' && trackerData.duration > 0) {
      trackerData.percentage = (element.currentTime / trackerData.duration) * 100;
    } else {
      trackerData.percentage = 0;
    }

    const eventData = {
      id: elementId,
      percentage: trackerData.percentage,
      isPlaying: !element.paused,
      duration: trackerData.duration,
      currentTime: element.currentTime,
      element: element,
      url: window.location.href
    };
    
    if (trackerData.duration && typeof trackerData.duration === 'number' && trackerData.duration > 0) {
       document.dispatchEvent(new CustomEvent('mediaPlaybackUpdate', { detail: eventData }));
    }
  };

  // Agregar event listeners
  element.addEventListener('loadedmetadata', element._metadataHandler);
  element.addEventListener('play', element._playHandler);
  element.addEventListener('pause', element._pauseHandler);
  element.addEventListener('ended', element._endedHandler);
  element.addEventListener('timeupdate', element._timeupdateHandler);

  console.log('Attached event listeners for:', elementId);
}

// 5. Escanear elementos de media
function scanForMediaElements() {
  console.log('Scanning for media elements at:', window.location.href);
  
  // Limpiar trackers obsoletos primero
  cleanupObsoleteTrackers();
  
  const mediaElements = document.querySelectorAll('video, audio');
  console.log('Found media elements:', mediaElements.length);
  
  mediaElements.forEach(function(element) {
    // Verificar si el elemento es visible y válido
    if (element.offsetParent !== null || element.offsetWidth > 0 || element.offsetHeight > 0) {
      processMediaElement(element);
    }
  });
  
  console.log('Finished scanning for media elements. Total trackers:', Object.keys(window.mediaTracker).length);
}

// 6. Observer mejorado con debouncing
let observerTimeout;
const observer = new MutationObserver(function(mutationsList) {
  // Debounce para evitar procesamiento excesivo
  clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    let foundNewMedia = false;
    
    mutationsList.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
              console.log('MutationObserver: Found added media element:', node);
              processMediaElement(node);
              foundNewMedia = true;
            } else if (node.querySelectorAll) {
              const nestedMediaElements = node.querySelectorAll('video, audio');
              if (nestedMediaElements.length > 0) {
                console.log('MutationObserver: Found nested media elements:', nestedMediaElements.length);
                nestedMediaElements.forEach(function(mediaElement) {
                  processMediaElement(mediaElement);
                  foundNewMedia = true;
                });
              }
            }
          }
        });
      }
    });
    
    if (foundNewMedia) {
      console.log('New media found via MutationObserver, current trackers:', Object.keys(window.mediaTracker).length);
    }
  }, 500); // Debounce de 500ms
});

// 7. Inicializar sistema de tracking
function initializeMediaTracker() {
  console.log('Initializing Media Tracker for URL:', window.location.href);
  
  // Detener observer anterior si existe
  if (window.mediaTrackerObserver) {
    window.mediaTrackerObserver.disconnect();
  }
  
  // Limpiar trackers antiguos
  cleanupObsoleteTrackers();
  
  // Escanear elementos existentes
  scanForMediaElements();
  
  // Iniciar nuevo observer
  if (document.body) {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false
    });
    window.mediaTrackerObserver = observer;
    console.log('MutationObserver started on document.body');
  } else {
    console.log('Document body not ready, retrying in 100ms');
    setTimeout(initializeMediaTracker, 100);
  }
}

// 8. Manejar cambios de página/URL
let currentURL = window.location.href;
function checkForURLChange() {
  if (currentURL !== window.location.href) {
    console.log('URL changed from', currentURL, 'to', window.location.href);
    currentURL = window.location.href;
    
    // Re-inicializar el tracker después de un breve delay
    setTimeout(() => {
      initializeMediaTracker();
    }, 1000);
  }
}

// 9. Función principal de inicio (renombrada para evitar conflictos)
function initMediaTrackingSystem() {
  console.log('Starting Media Tracking System');
  
  // Inicializar inmediatamente
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMediaTracker);
  } else {
    initializeMediaTracker();
  }
  
  // Monitorear cambios de URL cada 2 segundos
  setInterval(checkForURLChange, 2000);
  
  // También escuchar eventos de navegación
  window.addEventListener('popstate', () => {
    setTimeout(initializeMediaTracker, 500);
  });
  
  // Eventos de carga de página
  window.addEventListener('load', () => {
    setTimeout(initializeMediaTracker, 1000);
  });
  
  console.log('Media Tracking System initialized');
}

// 10. Función de utilidad para obtener estado actual
window.getMediaTrackingState = function() {
  return {
    trackers: Object.keys(window.mediaTracker).length,
    url: window.location.href,
    details: Object.entries(window.mediaTracker).map(([id, tracker]) => ({
      id,
      isPlaying: tracker.isPlaying,
      percentage: Math.round(tracker.percentage),
      duration: tracker.duration,
      elementType: tracker.element?.tagName,
      elementSrc: tracker.element?.src || tracker.element?.currentSrc
    }))
  };
};

// Función para configurar event listeners cuando el DOM esté listo
function setupEventListeners() {
  // Escuchar eventos de media y enviarlos al main process
  document.addEventListener('mediaPlaybackStart', (event) => {
    console.log('Media playback started:', event.detail)
    ipcRenderer.send('media-event', {
      type: 'start',
      data: event.detail,
      url: window.location.href,
      timestamp: Date.now()
    })
  })

  document.addEventListener('mediaPlaybackPause', (event) => {
    console.log('Media playback paused:', event.detail)
    ipcRenderer.send('media-event', {
      type: 'pause',
      data: event.detail,
      url: window.location.href,
      timestamp: Date.now()
    })
  })

  document.addEventListener('mediaPlaybackEnd', (event) => {
    console.log('Media playback ended:', event.detail)
    ipcRenderer.send('media-event', {
      type: 'end',
      data: event.detail,
      url: window.location.href,
      timestamp: Date.now()
    })
  })

  document.addEventListener('mediaPlaybackUpdate', (event) => {
    // Solo enviar actualizaciones cada 5 segundos para evitar spam
    if (!window.lastUpdateSent || Date.now() - window.lastUpdateSent > 5000) {
      window.lastUpdateSent = Date.now()
      ipcRenderer.send('media-event', {
        type: 'update',
        data: event.detail,
        url: window.location.href,
        timestamp: Date.now()
      })
    }
  })

  document.addEventListener('mediaPlaybackMetadata', (event) => {
    console.log('Media metadata loaded:', event.detail)
    ipcRenderer.send('media-event', {
      type: 'metadata',
      data: event.detail,
      url: window.location.href,
      timestamp: Date.now()
    })
  })

  console.log('Event listeners configured')
}

// Exponer API para el renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Función para obtener el estado actual del media tracking
  getMediaState: () => {
    if (typeof window.getMediaTrackingState === 'function') {
      return window.getMediaTrackingState()
    }
    return { trackers: 0, url: window.location.href, details: [] }
  },
  
  // Función para enviar datos al main process
  sendMediaData: (data) => {
    ipcRenderer.send('media-data', data)
  },
  
  // Función para reinicializar el tracking manualmente
  reinitializeTracking: async () => {
    await initializeMediaTracker()
  },

  // Función de prueba para verificar que el preload funciona
  test: () => {
    console.log('ElectronAPI test function called')
    return 'Preload working!'
  }
})

// Configurar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners)
} else {
  setupEventListeners()
}

// Auto-inicializar el sistema de tracking
initMediaTrackingSystem()

console.log('Preload script loaded successfully')

// Verificar que contextBridge funcionó
window.addEventListener('load', () => {
  console.log('Window loaded - electronAPI available:', !!window.electronAPI)
})