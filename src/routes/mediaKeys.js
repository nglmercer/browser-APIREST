import { Elysia } from 'elysia';

export default (mainWindow) => {
  const app = new Elysia()
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
    });
  return app;
};
