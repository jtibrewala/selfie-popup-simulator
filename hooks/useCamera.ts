import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraState } from '../types';

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isStreaming: false,
    stream: null,
    error: null,
    isLoading: false,
  });

  // Keep a ref to the live stream so cleanup/stop never reads a stale closure.
  const streamRef = useRef<MediaStream | null>(null);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopStreamTracks();
    setState(prev => ({ ...prev, isStreaming: false, stream: null }));
  }, [stopStreamTracks]);

  const startCamera = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Video only — this is a selfie video bubble; audio is never used and
      // requesting it would trigger an unnecessary microphone permission prompt.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setState({
        isStreaming: true,
        stream,
        error: null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Could not access camera.';

      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow camera access in your browser settings.';
      } else if (name === 'NotFoundError') {
        errorMessage = 'No camera device found.';
      } else if (name === 'NotReadableError') {
        errorMessage = 'Camera is currently in use by another application.';
      }

      setState({
        isStreaming: false,
        stream: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, []);

  // Cleanup on unmount — uses the ref so it always stops the active stream.
  useEffect(() => {
    return () => {
      stopStreamTracks();
    };
  }, [stopStreamTracks]);

  return {
    ...state,
    startCamera,
    stopCamera,
  };
};
