import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const MockContent: React.FC = () => {
  return (
    <div className="w-full min-h-screen p-8 md:p-12 lg:p-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
            Demo Environment
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Record your screen & camera <span className="text-indigo-600">instantly.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            This page represents the browser tab you would be looking at. 
            Use the control panel in the top-right to toggle the selfie camera overlay.
            Notice how the camera stays on top of this content.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 pointer-events-none select-none grayscale-[0.5]">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
        </div>

        <div className="absolute top-1/4 right-10 md:right-1/4 text-indigo-400 opacity-20">
             <ArrowUpRight size={400} />
        </div>
      </div>
    </div>
  );
};