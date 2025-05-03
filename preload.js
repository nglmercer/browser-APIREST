import { contextBridge } from 'electron'
import { ElectronBlocker } from '@ghostery/adblocker-electron-preload'

// Inicializar el bloqueador en el contexto de pre-carga
ElectronBlocker.fromPrebuiltAdsAndTracking((url) => fetch(url).then((response) => response.text()))
  .then((blocker) => {
    blocker.enableBlockingInPage()
  })