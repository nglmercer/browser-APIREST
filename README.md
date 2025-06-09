# Media Tracker Script (`media-tracker.js`)

This script allows you to monitor HTML5 video and audio elements on a web page, providing information about their playback status, progress, and other metadata.

## Features

- Tracks all `<video>` and `<audio>` elements on a page.
- Detects media elements present on initial page load.
- Detects media elements added dynamically to the page (e.g., via JavaScript).
- Assigns unique IDs to media elements if they don't have one for tracking purposes.
- Provides playback status (playing, paused, ended).
- Calculates and provides playback percentage.
- Dispatches custom DOM events for various media states.
- Stores the state of all tracked media in a global object `window.mediaTracker`.

## How to Use

1.  **Include the Script:**
    Add the `media-tracker.js` script to your HTML page, preferably towards the end of the `<body>` or with the `defer` attribute.
    ```html
    <script src="media-tracker.js" defer></script>
    ```

2.  **Listen for Custom Events:**
    The script dispatches the following custom events on the `document` object. You can listen for these events to get real-time updates about media playback.

    *   **`mediaPlaybackMetadata`**: Fired when a media element's metadata (like duration) is loaded.
        *   `event.detail`: `{ id: string, duration: number, element: HTMLMediaElement }`
            *   `id`: The ID of the media element (original or generated).
            *   `duration`: The total duration of the media in seconds.
            *   `element`: A reference to the media DOM element.

    *   **`mediaPlaybackStart`**: Fired when media playback starts or resumes from a paused state.
        *   `event.detail`: `{ id: string, element: HTMLMediaElement }`

    *   **`mediaPlaybackPause`**: Fired when media playback is paused.
        *   `event.detail`: `{ id: string, percentage: number, element: HTMLMediaElement }`
            *   `percentage`: The playback percentage at which the media was paused.

    *   **`mediaPlaybackEnd`**: Fired when media playback reaches the end.
        *   `event.detail`: `{ id: string, element: HTMLMediaElement }`

    *   **`mediaPlaybackUpdate`**: Fired frequently as the media plays and its `currentTime` updates.
        *   `event.detail`: `{ id: string, percentage: number, isPlaying: boolean, duration: number, currentTime: number, element: HTMLMediaElement }`
            *   `percentage`: Current playback percentage (0-100).
            *   `isPlaying`: Boolean, true if currently playing.
            *   `duration`: Total duration of the media.
            *   `currentTime`: Current playback time in seconds.

    **Example:**
    ```javascript
    document.addEventListener('mediaPlaybackStart', (e) => {
        console.log('Media started:', e.detail.id, e.detail.element);
    });

    document.addEventListener('mediaPlaybackUpdate', (e) => {
        console.log(
            `Media update for ${e.detail.id}:`,
            `Percentage: ${e.detail.percentage.toFixed(2)}%`,
            `Is Playing: ${e.detail.isPlaying}`
        );
    });

    document.addEventListener('mediaPlaybackPause', (e) => {
        console.log('Media paused:', e.detail.id, `at ${e.detail.percentage.toFixed(2)}%`);
    });
    ```

3.  **Accessing Data via Global Object (Alternative):**
    The script also maintains a global object `window.mediaTracker` which stores the current state of all tracked media elements. The key for each element is its ID (original or generated).

    *   `window.mediaTracker[elementId]` contains:
        *   `element`: Reference to the DOM element.
        *   `isPlaying`: Boolean, true if currently playing.
        *   `percentage`: Current playback percentage.
        *   `duration`: Media duration in seconds.

    **Example:**
    ```javascript
    // Get status for a specific media element
    const myVideoStatus = window.mediaTracker['video1'];
    if (myVideoStatus) {
        console.log('Current status of video1:', myVideoStatus);
    }

    // Iterate over all tracked media
    for (const mediaId in window.mediaTracker) {
        if (window.mediaTracker.hasOwnProperty(mediaId)) {
            const mediaInfo = window.mediaTracker[mediaId];
            console.log(`Info for ${mediaId}: Playing - ${mediaInfo.isPlaying}, Percentage - ${mediaInfo.percentage}%`);
        }
    }
    ```
    Note: While convenient, listening to custom events is generally preferred for reacting to changes, as it's more event-driven.

## Files

*   `media-tracker.js`: The core JavaScript file.
*   `test.html`: A demonstration and test page showing how to use the script and observe its behavior.

## How it Works

The script scans the DOM for `<video>` and `<audio>` elements. For each element, it attaches event listeners (`play`, `pause`, `ended`, `timeupdate`, `loadedmetadata`). When these events fire, the script updates its internal tracking information and dispatches the corresponding custom DOM events. A `MutationObserver` is used to detect and handle media elements that are added to the page after the initial load.