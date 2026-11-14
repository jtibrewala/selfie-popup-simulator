import React, { useState, useEffect, useCallback } from 'react';
import { ControlPanel } from './ControlPanel';
import { BubbleSize } from '../types';

declare var chrome: any;

const RESTRICTED_PREFIXES = ['chrome://', 'edge://', 'about:', 'https://chrome.google.com/webstore'];

export const ExtensionPopup: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  // Real camera state, synced from the content script on open (not assumed).
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>('small');

  // Resolve the active tab, guarding against restricted system pages.
  const withActiveTab = useCallback(
    (cb: (tabId: number) => void) => {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        setError('Extension API unavailable. (Simulator Mode?)');
        setIsLoading(false);
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        const activeTab = tabs?.[0];
        if (!activeTab?.id) {
          setError('No active tab found.');
          setIsLoading(false);
          return;
        }
        if (RESTRICTED_PREFIXES.some(p => activeTab.url?.startsWith(p))) {
          setError('Cannot record on this system page.');
          setIsLoading(false);
          return;
        }
        cb(activeTab.id);
      });
    },
    []
  );

  // On open, ask the content script whether the camera overlay is already active.
  useEffect(() => {
    withActiveTab((tabId) => {
      chrome.tabs.sendMessage(tabId, { action: 'GET_STATUS' }, (response: any) => {
        if (chrome.runtime.lastError) {
          // Content script not present yet (page predates install / needs refresh).
          setError('Please refresh this page to enable recording.');
          setIsStreaming(false);
        } else {
          setIsStreaming(!!response?.isOpen);
          // Re-sync the size selector with the camera's actual current size.
          const s = response?.size;
          if (s === 'small' || s === 'medium' || s === 'large') {
            setBubbleSize(s);
          }
          setError(null);
        }
        setIsLoading(false);
      });
    });
  }, [withActiveTab]);

  const handleToggle = useCallback(() => {
    setError(null);
    withActiveTab((tabId) => {
      chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_CAMERA' }, (response: any) => {
        if (chrome.runtime.lastError) {
          setError('Please refresh this page to enable recording.');
          return;
        }
        // Trust the content script's authoritative result.
        setIsStreaming(!!response?.isOpen);
      });
    });
  }, [withActiveTab]);

  const handleSizeChange = useCallback((size: BubbleSize) => {
    setBubbleSize(size);
    withActiveTab((tabId) => {
      // Best-effort relay; ignore errors (camera may be off).
      chrome.tabs.sendMessage(tabId, { action: 'SET_SIZE', size }, () => void chrome.runtime.lastError);
    });
  }, [withActiveTab]);

  return (
    <div style={{ width: 320 }} className="bg-white">
      <ControlPanel
        isStreaming={isStreaming}
        isLoading={isLoading}
        error={error}
        onStart={handleToggle}
        onStop={handleToggle}
        bubbleSize={bubbleSize}
        onSizeChange={handleSizeChange}
        badgeText="Extension"
        embedded
      />
    </div>
  );
};
