'use client';

import React from 'react';
import { useRaceStore } from '@/store/useRaceStore';

const TOTAL_SEGMENTS = 22;

export function Speedometer() {
  const speedKmh = useRaceStore((s) => s.speedKmh);
  const rpm = useRaceStore((s) => s.rpm);
  const gear = useRaceStore((s) => s.gear);

  const litCount = Math.round(rpm * TOTAL_SEGMENTS);

  return (
    <div className="flex flex-col items-center pointer-events-none mb-1">
      {/* Segmented LED Gauge Housing */}
      <div className="bg-slate-900/80 border border-white/20 rounded-t-xl rounded-b-xs px-2.5 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-0.5">
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
          const isLit = idx < litCount;
          const isDanger = idx >= TOTAL_SEGMENTS - 3;
          const isWarning = idx >= TOTAL_SEGMENTS - 7;

          let segColor = 'bg-white/20';
          if (isLit) {
            if (isDanger) segColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]';
            else if (isWarning) segColor = 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.85)]';
            else segColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]';
          }

          return (
            <div
              key={idx}
              className={`w-1.5 h-4.5 rounded-xs transform -skew-x-14 transition-colors duration-75 ${segColor}`}
            />
          );
        })}
      </div>

      {/* Speed Readout Pill: 140 km/h */}
      <div className="bg-slate-900/90 border border-white/20 rounded-md px-5 py-1 mt-1 shadow-lg flex items-baseline gap-1 font-mono">
        <span className="text-2xl font-black text-white">{Math.round(speedKmh)}</span>
        <span className="text-xs font-bold text-slate-400">km/h</span>
      </div>

      {/* Gear Badge */}
      <div className="text-[11px] font-black tracking-widest text-sky-400 mt-0.5">
        GEAR {gear}
      </div>
    </div>
  );
}
