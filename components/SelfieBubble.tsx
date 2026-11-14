import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GripHorizontal } from 'lucide-react';
import { BubbleSize } from '../types';

interface SelfieBubbleProps {
  stream: MediaStream | null;
  size: BubbleSize;
  /** Optional drag lifecycle hooks (used by the extension overlay to toggle iframe interactivity). */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Reports the bubble's viewport rect so the overlay can hit-test it. */
  onRectChange?: (rect: { x: number; y: number; w: number; h: number }) => void;
}

interface Position {
  x: number;
  y: number;
}

const sizeClasses: Record<BubbleSize, string> = {
  small: 'w-32 h-32',
  medium: 'w-48 h-48 md:w-56 md:h-56',
  large: 'w-72 h-72 md:w-80 md:h-80',
};

// Keyboard nudge distance (px) for accessible repositioning.
const KEYBOARD_STEP = 20;

/** Clamp a position so the element stays fully within the viewport. */
const clampToViewport = (x: number, y: number, width: number, height: number): Position => {
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - height);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
};

const SelfieBubbleComponent: React.FC<SelfieBubbleProps> = ({ stream, size, onDragStart, onDragEnd, onRectChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // null = not yet moved (use default bottom-right CSS anchor).
  const [position, setPosition] = useState<Position | null>(null);
  const isDragging = useRef(false);
  const dragStartOffset = useRef<Position>({ x: 0, y: 0 });
  // Track the active pointer so touch + mouse behave identically.
  const activePointerId = useRef<number | null>(null);

  // Attach the stream to the video element.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Report the bubble's viewport rect whenever it could have changed (stream
  // appears, position moves, size changes). Used by the extension overlay to
  // hit-test the pointer against the bubble.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onRectChange) return;
    const r = el.getBoundingClientRect();
    onRectChange({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [stream, position, size, onRectChange]);

  // Keep the bubble on-screen if the window is resized after it has been moved.
  useEffect(() => {
    const handleResize = () => {
      const el = containerRef.current;
      if (!el) return;
      setPosition(prev => {
        if (!prev) return prev;
        const rect = el.getBoundingClientRect();
        return clampToViewport(prev.x, prev.y, rect.width, rect.height);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || e.pointerId !== activePointerId.current) return;
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;

    const nextX = e.clientX - dragStartOffset.current.x;
    const nextY = e.clientY - dragStartOffset.current.y;
    setPosition(clampToViewport(nextX, nextY, width, height));
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    isDragging.current = false;
    activePointerId.current = null;
    const el = containerRef.current;
    // Release the capture if we still hold it.
    if (el?.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    onDragEnd?.();
  }, [onDragEnd]);

  // Reset any lingering body styles if we unmount mid-drag.
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    activePointerId.current = e.pointerId;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    onDragStart?.();

    // Capture the pointer to this element so move/up events keep arriving even
    // when the cursor passes over areas outside the element — essential inside
    // the extension's pointer-events:none full-screen iframe.
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    dragStartOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Convert the default CSS (bottom-right) anchor into absolute coords on
    // first interaction so the bubble doesn't jump.
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
  };

  // Keyboard accessibility: arrow keys nudge the bubble, clamped to viewport.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const deltas: Record<string, Position> = {
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();

    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;
    const base = position ?? { x: rect?.left ?? 0, y: rect?.top ?? 0 };
    setPosition(clampToViewport(base.x + delta.x, base.y + delta.y, width, height));
  };

  if (!stream) return null;

  const containerStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' }
    : {};

  const containerClasses = position
    ? 'fixed z-[100] group cursor-grabbing touch-none'
    : 'fixed bottom-8 right-8 z-[100] group cursor-grab touch-none';

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Selfie camera overlay. Click and drag or use arrow keys to move."
      tabIndex={0}
    >
      {/* Pulse Effect Background */}
      <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping group-hover:opacity-10 pointer-events-none" />

      {/* Main Container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-900 transition-all duration-300 hover:scale-105 hover:border-indigo-100`}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
        />

        {/* Hover Controls Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center flex-col gap-2 pointer-events-none">
          <div className="bg-black/30 p-2 rounded-full backdrop-blur-sm text-white/80">
            <GripHorizontal size={20} />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/90 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-bold tracking-wide">LIVE</span>
          </div>
        </div>
      </div>

      {/* Connection decorative line (only in the default resting state) */}
      {!position && (
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-full -z-10 opacity-20 blur-xl pointer-events-none" />
      )}
    </div>
  );
};

export const SelfieBubble = React.memo(SelfieBubbleComponent);
