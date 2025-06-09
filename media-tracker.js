// 1. Initialize window.mediaTracker
window.mediaTracker = {};

// 2. Create a function generateUniqueId()
function generateUniqueId() {
  return 'media_tracker_id_' + Math.random().toString(36).substr(2, 9);
}

// 3. Create a function processMediaElement(element)
function processMediaElement(element) {
  let elementId = element.id;
  if (!elementId) {
    elementId = generateUniqueId();
    element.id = elementId;
    console.log('Generated new ID for media element:', elementId);
  }

  if (window.mediaTracker[elementId]) {
    console.log('Media element already processed:', elementId);
    return;
  }

  console.log('Processing media element:', elementId);
  window.mediaTracker[elementId] = {
    isPlaying: false,
    percentage: 0,
    element: element,
    duration: 0
  };

  element.addEventListener('loadedmetadata', function() {
    console.log('loadedmetadata for:', elementId, 'duration:', element.duration);
    window.mediaTracker[elementId].duration = element.duration;

    const eventData = { id: elementId, duration: element.duration, element: element };
    console.log('Dispatching mediaPlaybackMetadata for element:', elementId, eventData);
    document.dispatchEvent(new CustomEvent('mediaPlaybackMetadata', { detail: eventData }));
  });

  element.addEventListener('play', function() {
    console.log('play event for:', elementId);
    window.mediaTracker[elementId].isPlaying = true;

    const eventData = { id: elementId, element: element };
    console.log('Dispatching mediaPlaybackStart for element:', elementId, eventData);
    document.dispatchEvent(new CustomEvent('mediaPlaybackStart', { detail: eventData }));
  });

  element.addEventListener('pause', function() {
    console.log('pause event for:', elementId);
    window.mediaTracker[elementId].isPlaying = false;

    const eventData = { id: elementId, percentage: window.mediaTracker[elementId].percentage, element: element };
    console.log('Dispatching mediaPlaybackPause for element:', elementId, eventData);
    document.dispatchEvent(new CustomEvent('mediaPlaybackPause', { detail: eventData }));
  });

  element.addEventListener('ended', function() {
    console.log('ended event for:', elementId);
    window.mediaTracker[elementId].isPlaying = false;
    window.mediaTracker[elementId].percentage = 100;

    const eventData = { id: elementId, element: element };
    console.log('Dispatching mediaPlaybackEnd for element:', elementId, eventData);
    document.dispatchEvent(new CustomEvent('mediaPlaybackEnd', { detail: eventData }));
  });

  element.addEventListener('timeupdate', function() {
    const trackerData = window.mediaTracker[elementId];
    // Ensure duration is a positive number
    if (trackerData.duration && typeof trackerData.duration === 'number' && trackerData.duration > 0) {
      trackerData.percentage = (element.currentTime / trackerData.duration) * 100;
    } else {
      trackerData.percentage = 0; // Default to 0 if duration is invalid
    }
    // console.log('timeupdate for:', elementId, 'currentTime:', element.currentTime, 'percentage:', trackerData.percentage); // Can be noisy

    const eventData = {
      id: elementId,
      percentage: trackerData.percentage,
      isPlaying: true, // At timeupdate, if it's not paused/ended, it's effectively playing
      duration: trackerData.duration,
      currentTime: element.currentTime,
      element: element
    };
    // Dispatch event only if duration is valid, otherwise percentage might be misleading
    if (trackerData.duration && typeof trackerData.duration === 'number' && trackerData.duration > 0) {
       // console.log('Dispatching mediaPlaybackUpdate for element:', elementId, eventData); // This is very noisy
       document.dispatchEvent(new CustomEvent('mediaPlaybackUpdate', { detail: eventData }));
    }
  });

  console.log('Attached event listeners for:', elementId);
}

// 4. Create a function scanForMediaElements()
function scanForMediaElements() {
  console.log('Scanning for media elements...');
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(function(element) {
    processMediaElement(element);
  });
  console.log('Finished scanning for media elements. Found:', mediaElements.length);
}

// 5. Implement a MutationObserver
const observer = new MutationObserver(function(mutationsList) {
  mutationsList.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
          console.log('MutationObserver: Found added media element:', node);
          processMediaElement(node);
        } else if (node.childNodes && node.childNodes.length > 0) {
          // If an added node has children, query within those children
          const nestedMediaElements = node.querySelectorAll('video, audio');
          nestedMediaElements.forEach(function(mediaElement) {
            console.log('MutationObserver: Found nested media element:', mediaElement);
            processMediaElement(mediaElement);
          });
        }
      });
    }
  });
});

// 6. Call scanForMediaElements() once when the script loads
scanForMediaElements();

// 7. Start the MutationObserver
observer.observe(document.body, { childList: true, subtree: true });
console.log('MutationObserver started on document.body');
