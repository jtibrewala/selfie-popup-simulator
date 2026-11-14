# SelfiePopup

A Chrome extension (Manifest V3) that overlays a draggable, resizable **webcam bubble** on any web page — plus a browser-based **simulator** for developing the UI without packing the extension.

Built with React + Vite + TypeScript + Tailwind.

---

## What it does

- Click the toolbar icon → **Start Camera** → a circular, mirrored webcam bubble appears over the current page.
- **Drag** the bubble anywhere (mouse or touch); it stays within the viewport.
- Move it with the **keyboard** (focus it, then arrow keys).
- Change the **bubble size** (Small / Medium / Large) from the popup.
- The popup always reflects the camera's real state (on/off and current size).

---

## Architecture

The project runs in two forms from a single codebase, routed by a `?mode=` query param in `index.tsx`:

| Mode | Entry | Context | Purpose |
|------|-------|---------|---------|
| Simulator (default) | `App` | normal web page (`npm run dev`) | Develop/preview the whole UI with a mock page + floating control panel |
| `?mode=popup` | `ExtensionPopup` | extension toolbar popup | The real control panel; talks to the content script |
| `?mode=camera` | `ExtensionCamera` | iframe injected into the page | Hosts the webcam bubble over the live page |

**Extension message flow:** popup → `chrome.tabs.sendMessage` → `content.js` (injects/removes the camera iframe, relays size, tracks state) → `postMessage` → camera iframe.

Key files:
- `components/SelfieBubble.tsx` — the webcam bubble: drag (pointer capture), viewport clamping, keyboard a11y, rect reporting.
- `components/ControlPanel.tsx` — shared control UI (floating in the simulator, `embedded` in the popup).
- `components/ExtensionPopup.tsx` — popup logic; syncs real state via `GET_STATUS`.
- `components/ExtensionCamera.tsx` — mounts the bubble in the injected iframe; relays rect/drag/size.
- `hooks/useCamera.ts` — `getUserMedia` lifecycle (video only).
- `public/content.js` — content script: iframe lifecycle, pointer-events hit-testing, state tracking.
- `public/manifest.json` — MV3 manifest.

---

## Development (simulator)

```bash
npm install
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173/`). This runs the full UI against a mock page using your real webcam — no extension packing required. Great for iterating on the bubble and control panel.

Other scripts: `npm run build`, `npm run preview`.

---

## Build & load as a Chrome extension

### 1. Build
```bash
npm install
npm run build
```
This creates a `build/` folder containing `index.html`, `manifest.json`, `content.js`, and hashed JS/CSS under `assets/`.

### 2. Load into Chrome
1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select the **`build/`** folder (not `public/` or `src/`).
4. After any rebuild, click the **reload ↻** icon on the extension card.

### 3. Use
1. Open a normal **`https://`** website (see note below). Extensions don't run on `chrome://` pages or the empty New Tab page.
2. (Optional) Pin "SelfiePopup" to the toolbar.
3. Click the icon → **Start Camera** → **Allow** the camera prompt.
4. The bubble appears bottom-right. Drag it, resize it from the popup, or focus it and use arrow keys.
5. Click the icon → **Stop Camera** to remove it.

---

## Notes & troubleshooting

- **Use HTTPS pages.** `getUserMedia` requires a secure context. On `http://` pages the camera is denied by the browser regardless of the extension.
- **Camera permission** is granted at runtime (the `getUserMedia` prompt + the iframe's `allow="camera"`), **not** via a manifest permission. `camera`/`microphone` are *not* valid MV3 `permissions` and will cause a "Permission 'camera' is unknown" load error if added.
- **"Please refresh this page to enable recording."** The content script wasn't present (the page was open before the extension loaded/updated). Refresh the tab.
- **Only video is requested** — no microphone — so you should see only a camera prompt.
- The overlay iframe is click-through (`pointer-events: none`) except over the bubble, so the underlying page stays usable.

---

## Changelog

### 2026-Oct-Updates (2026-10-03)

Branch of enhancements and extension fixes.

**Features / improvements**
- Robust bubble dragging via **Pointer Events** (mouse, touch, and pen) with a single code path.
- Bubble is **clamped within the viewport** while dragging and on window resize.
- **Keyboard accessibility**: the bubble is focusable (`role="application"`, `tabIndex`) and movable with arrow keys.
- Camera requests **video only** (no microphone), avoiding an unnecessary permission prompt.
- Minor hardening in `useCamera` (stream ref to avoid stale closures, typed error handling) and `React.memo` on the bubble.
- Added `@types/node` so `tsc --noEmit` is clean.

**Extension (MV3) fixes**
- **Load fix:** removed a remote CDN import map (blocked by MV3 CSP) and set Vite `base: './'`; exposed `assets/*` in `web_accessible_resources` so the camera iframe can load its bundle.
- **Invalid permission:** removed `camera` (and `microphone`) from manifest `permissions` — not valid MV3 permissions; caused the manifest to be rejected.
- **Blank popup:** gave the popup real dimensions (static, 320px-wide layout via an `embedded` ControlPanel) instead of a zero-size fixed-position panel.
- **State desync:** the popup now queries the content script (`GET_STATUS`) on open and reflects the real camera on/off state (no longer toggles the camera off on reopen).
- **Size control:** wired the popup's size selector through `content.js` (`SET_SIZE` → `postMessage`) to the camera.
- **Draggable in the overlay iframe:** the content script hit-tests the pointer against the bubble's reported rect and toggles the iframe's `pointer-events`, so the click-through overlay is grabbable only over the bubble.
- **Size persistence:** the popup remembers and re-displays the current bubble size on reopen (tracked in `content.js`, returned via `GET_STATUS`).
