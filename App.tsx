import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SelfieBubble } from './components/SelfieBubble';
import { MockContent } from './components/MockContent';
import { useCamera } from './hooks/useCamera';
import { BubbleSize } from './types';

const App: React.FC = () => {
  const { isStreaming, stream, isLoading, error, startCamera, stopCamera } = useCamera();
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>('small');

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 
        Layer 1: The background "page" content. 
        In a real extension, this would be the active browser tab.
      */}
      <MockContent />

      {/* 
        Layer 2: The Extension Popup Controller.
        In a real extension, this is the popup.html.
      */}
      <ControlPanel 
        isStreaming={isStreaming}
        isLoading={isLoading}
        error={error}
        onStart={startCamera}
        onStop={stopCamera}
        bubbleSize={bubbleSize}
        onSizeChange={setBubbleSize}
        badgeText="Simulator"
      />

      {/* 
        Layer 3: The Content Script Overlay.
        In a real extension, this is injected into the DOM.
      */}
      {isStreaming && (
        <SelfieBubble stream={stream} size={bubbleSize} />
      )}
      
      {/* Global permission error toast backup */}
      {error && !isLoading && !isStreaming && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium animate-bounce z-[200]">
          {error}
        </div>
      )}
    </div>
  );
};

export default App;