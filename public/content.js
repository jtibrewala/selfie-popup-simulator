// This script runs on every page you visit.
// It listens for messages from the Popup to toggle the camera overlay.

(function() {
  if (window.hasSelfiePopupInjected) return;
  window.hasSelfiePopupInjected = true;

  let iframe = null;
  let bubbleRect = null;   // latest bubble bounds reported by the iframe
  let dragging = false;    // true while the bubble is being dragged
  let currentSize = 'small'; // last applied bubble size (persists across popup opens)

  // Decide whether the overlay iframe should capture pointer events: only when
  // the pointer is over the bubble, or while a drag is in progress. Otherwise
  // the full-screen iframe stays click-through so the page remains usable.
  const updateInteractivity = (x, y) => {
    if (!iframe) return;
    let interactive = dragging;
    if (!interactive && bubbleRect && x != null) {
      interactive =
        x >= bubbleRect.x && x <= bubbleRect.x + bubbleRect.w &&
        y >= bubbleRect.y && y <= bubbleRect.y + bubbleRect.h;
    }
    iframe.style.pointerEvents = interactive ? 'auto' : 'none';
  };

  document.addEventListener('pointermove', (e) => {
    if (!iframe || dragging) return;
    updateInteractivity(e.clientX, e.clientY);
  }, true);

  // Messages from the camera iframe (same-origin extension page).
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !iframe || event.source !== iframe.contentWindow) return;

    if (data.type === 'SELFIE_BUBBLE_RECT') {
      bubbleRect = data.rect; // { x, y, w, h } in viewport coords
    } else if (data.type === 'SELFIE_DRAG') {
      dragging = !!data.dragging;
      // Keep interactive during drag; re-evaluate when it ends.
      if (dragging) iframe.style.pointerEvents = 'auto';
      else iframe.style.pointerEvents = 'none';
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Report current camera state so the popup can sync its UI on open.
    if (request.action === 'GET_STATUS') {
      sendResponse({ isOpen: !!iframe, size: currentSize });
      return true;
    }

    // Relay a bubble-size change into the camera iframe.
    if (request.action === 'SET_SIZE') {
      currentSize = request.size; // remember so the popup can re-sync on reopen
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SELFIE_SET_SIZE', size: request.size }, new URL(iframe.src).origin);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
      return true;
    }

    if (request.action === 'TOGGLE_CAMERA') {
      if (iframe) {
        // If open, close it
        iframe.remove();
        iframe = null;
        bubbleRect = null;
        dragging = false;
        currentSize = 'small'; // fresh camera starts at small
        sendResponse({ isOpen: false });
      } else {
        // If closed, open it
        iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.zIndex = '2147483647'; // Max z-index
        iframe.style.pointerEvents = 'none'; // Let clicks pass through empty areas
        // Chrome paints a transparent iframe opaque (white) when its color-scheme
        // differs from the host page's (e.g. a dark-mode site). Our iframe page is
        // light, so declare that here to keep the overlay see-through.
        iframe.style.colorScheme = 'light';
        iframe.style.background = 'transparent';
        iframe.allow = "camera"; // Allow camera permission (video-only selfie bubble)

        // Point to our React app in 'camera' mode
        iframe.src = chrome.runtime.getURL('index.html?mode=camera');

        document.body.appendChild(iframe);
        sendResponse({ isOpen: true });
      }
    }
    return true;
  });
})();