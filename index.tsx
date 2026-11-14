import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ExtensionPopup } from './components/ExtensionPopup';
import { ExtensionCamera } from './components/ExtensionCamera';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple routing based on query parameters to support Extension architecture
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

// If the background is transparent (Camera Mode), we need to ensure the HTML/Body is too
if (mode === 'camera') {
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
}

// Popup Mode: the toolbar popup must size itself to its content. The default
// full-screen root (h-screen/w-screen) + body overflow-hidden would otherwise
// collapse/clip the popup to a blank 0-sized window.
if (mode === 'popup') {
  rootElement.className = '';
  document.body.classList.remove('overflow-hidden');
  document.body.style.width = '320px';
}

let ComponentToRender = App; // Default to Simulator

if (mode === 'popup') {
  ComponentToRender = ExtensionPopup;
} else if (mode === 'camera') {
  ComponentToRender = ExtensionCamera;
}

root.render(
  <React.StrictMode>
    <ComponentToRender />
  </React.StrictMode>
);