'use client';

import React, { useEffect, useCallback } from 'react';
import { useRaceStore } from '@/store/useRaceStore';

function formatMillis(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '00.00.000';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${String(m).padStart(2, '0')}.${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function FinishModal() {
  const gameState = useRaceStore((s) => s.gameState);
  const rank = useRaceStore((s) => s.rank);
  const bestLapTime = useRaceStore((s) => s.bestLapTime);
  const totalTime = useRaceStore((s) => s.totalTime);
  const resetRace = useRaceStore((s) => s.resetRace);
  const setGameState = useRaceStore((s) => s.setGameState);

  const handleRetry = useCallback(() => {
    resetRace();
    setGameState('START');
  }, [resetRace, setGameState]);

  useEffect(() => {
    if (gameState !== 'FINISH') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleRetry]);

  if (gameState !== 'FINISH') return null;

  const rankText = rank === 1 ? '1st PLACE 🏆' : rank === 2 ? '2nd PLACE 🥈' : rank === 3 ? '3rd PLACE 🥉' : `${rank}th PLACE`;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900/95 border border-amber-400/40 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
        <h2 className="text-3xl font-black tracking-wider text-amber-400 uppercase mb-1">
          CHEQUERED FLAG!
        </h2>
        <p className="text-xs font-bold text-slate-400 mb-5 tracking-widest uppercase">
          GRAND PRIX FINISHED
        </p>

        <div className="bg-slate-950/90 border border-amber-400/30 rounded-xl p-4 mb-5">
          <div className="text-xs font-bold text-slate-400 uppercase">FINAL POSITION</div>
          <div className="text-3xl sm:text-4xl font-black text-amber-400 my-1 font-mono">
            {rankText}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">BEST LAP</div>
              <div className="text-sm font-black text-sky-400 font-mono">
                {formatMillis(bestLapTime)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">TOTAL TIME</div>
              <div className="text-sm font-black text-white font-mono">
                {formatMillis(totalTime)}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 border border-sky-300 rounded-lg font-black text-white shadow-lg active:scale-98 transition-transform cursor-pointer"
        >
          RACE AGAIN
        </button>
      </div>
    </div>
  );
}
