'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { useRaceStore } from '@/store/useRaceStore';

interface TopBarProps {
  onPause: () => void;
}

function formatMillis(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '00.00.000';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${String(m).padStart(2, '0')}.${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function TopBar({ onPause }: TopBarProps) {
  const lap = useRaceStore((s) => s.lap);
  const totalLaps = useRaceStore((s) => s.totalLaps);
  const rank = useRaceStore((s) => s.rank);
  const totalRacers = useRaceStore((s) => s.totalRacers);
  const raceTime = useRaceStore((s) => s.raceTime);

  return (
    <div className="flex justify-between items-center w-full px-4 pt-3 pointer-events-none">
      {/* Top-Left Group: Pause, Lap, Position */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Pause Button [ || ] */}
        <button
          onClick={onPause}
          className="w-11 h-11 bg-slate-900/80 border border-white/20 rounded-md flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-md"
          title="Pause Game"
        >
          <div className="flex gap-1">
            <span className="w-1.5 h-4.5 bg-white rounded-xs"></span>
            <span className="w-1.5 h-4.5 bg-white rounded-xs"></span>
          </div>
        </button>

        {/* Lap Badge: LAP 1/2 */}
        <div className="bg-slate-900/85 border border-white/20 rounded-md px-4 py-2 font-black text-xl tracking-wider text-white shadow-lg backdrop-blur-md">
          LAP {lap}/{totalLaps}
        </div>

        {/* Position: POS 1/6 */}
        <div className="bg-slate-900/85 border border-white/20 rounded-md px-3 py-2 font-bold text-lg tracking-wide text-amber-400 shadow-lg backdrop-blur-md">
          POS {rank}/{totalRacers}
        </div>
      </div>

      {/* Top-Right Group: Stopwatch Timer */}
      <div className="bg-slate-900/85 border border-white/20 rounded-md px-4 py-2 flex items-center gap-2.5 font-mono font-bold text-xl tracking-wider text-white shadow-lg backdrop-blur-md pointer-events-auto">
        <Timer className="w-5 h-5 text-white" />
        <span>{formatMillis(raceTime)}</span>
      </div>
    </div>
  );
}
