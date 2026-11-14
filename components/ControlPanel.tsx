import React from 'react';
import { Video, StopCircle, Camera, AlertCircle, Loader2, Settings, Scaling } from 'lucide-react';
import { BubbleSize } from '../types';

interface ControlPanelProps {
  isStreaming: boolean;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
  bubbleSize: BubbleSize;
  onSizeChange: (size: BubbleSize) => void;
  badgeText?: string;
  /** When true, render in-flow (for the extension popup) instead of a floating fixed panel (simulator). */
  embedded?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isStreaming,
  isLoading,
  onStart,
  onStop,
  error,
  bubbleSize,
  onSizeChange,
  badgeText = "Extension",
  embedded = false,
}) => {
  // Simulator: floating card pinned top-right over the mock page.
  // Embedded (popup): static, full-width card that gives the popup real size.
  const rootClass = embedded
    ? "w-full bg-white p-6 font-sans"
    : "fixed top-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50 font-sans animate-in slide-in-from-top-4 duration-500";

  return (
    <div className={rootClass}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">SelfiePopup</h2>
        </div>
        <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {badgeText}
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 leading-tight">{error}</p>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Camera</span>
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <p className="text-xs text-slate-500">
            {isStreaming 
              ? "Recording active. Bubble is visible." 
              : "Camera is currently off."}
          </p>
        </div>

        {!isStreaming ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span>Start Camera</span>
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold py-3 px-4 rounded-xl transition-all"
          >
            <StopCircle className="w-5 h-5" />
            <span>Stop Camera</span>
          </button>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</span>
        </div>
        
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
                <Scaling className="w-4 h-4" />
                <span>Bubble Size</span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {(['small', 'medium', 'large'] as BubbleSize[]).map((size) => (
                    <button
                        key={size}
                        onClick={() => onSizeChange(size)}
                        className={`
                            px-2 py-1.5 text-xs font-medium rounded-md transition-all capitalize
                            ${bubbleSize === size
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }
                        `}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};