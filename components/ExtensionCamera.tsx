import React, { useState, useEffect, useCallback } from 'react';
import { SelfieBubble } from './SelfieBubble';
import { useCamera } from '../hooks/useCamera';
import { BubbleSize } from '../types';

export const ExtensionCamera: React.FC = () => {
  const { stream, startCamera, error } = useCamera();
  const [size, setSize] = useState<BubbleSize>('small');

  // Auto-start camera when this component mounts (which happens when iframe is injected)
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Receive bubble-size changes relayed from the popup via the content script.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      const data = e.data;
      if (data && data.type === 'SELFIE_SET_SIZE') {
        const next = data.size as BubbleSize;
        if (next === 'small' || next === 'medium' || next === 'large') {
          setSize(next);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // The injected iframe is pointer-events:none so the page stays usable. The
  // content script flips it to pointer-events:auto only when the pointer is
  // over the bubble (using the rect we report) or while dragging.
  const postToParent = useCallback((msg: unknown) => {
    window.parent?.postMessage(msg, '*');
  }, []);

  const handleRectChange = useCallback((rect: { x: number; y: number; w: number; h: number }) => {
    postToParent({ type: 'SELFIE_BUBBLE_RECT', rect });
  }, [postToParent]);

  const handleDragStart = useCallback(() => {
    postToParent({ type: 'SELFIE_DRAG', dragging: true });
  }, [postToParent]);

  const handleDragEnd = useCallback(() => {
    postToParent({ type: 'SELFIE_DRAG', dragging: false });
  }, [postToParent]);

  if (error) {
    return (
      <div className="fixed bottom-8 right-8 bg-red-600 text-white px-4 py-2 rounded-lg shadow-xl z-[999999] font-sans">
        <p className="font-bold">Camera Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // The wrapper div is pointer-events-none so clicks pass through the empty iframe areas.
  // The SelfieBubble wrapper is pointer-events-auto to capture interactions.
  return (
    <div className="w-screen h-screen pointer-events-none relative overflow-hidden">
      <div className="pointer-events-auto">
        <SelfieBubble
          stream={stream}
          size={size}
          onRectChange={handleRectChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  );
};