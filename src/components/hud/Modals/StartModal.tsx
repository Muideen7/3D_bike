'use client';

import React, { useEffect, useCallback } from 'react';
import { useRaceStore } from '@/store/useRaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';
import { QualityTier } from '@/types/controls.types';

export function StartModal() {
  const gameState = useRaceStore((s) => s.gameState);
  const setGameState = useRaceStore((s) => s.setGameState);
  const setCountdown = useRaceStore((s) => s.setCountdown);

  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);

  const handleStart = useCallback(() => {
    soundEngine.init();
    soundEngine.resume();

    setGameState('COUNTDOWN');
    setCountdown(3);
    soundEngine.playBeep(false);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        soundEngine.playBeep(false);
      } else if (count === 0) {
        setCountdown(0);
        soundEngine.playBeep(true);
        setGameState('RACING');
        clearInterval(interval);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }, [setGameState, setCountdown]);

  useEffect(() => {
    if (gameState !== 'START') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleStart]);

  if (gameState !== 'START') return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900/90 border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-300 to-sky-500 uppercase">
          SUPERBIKE GP 3D
        </h1>
        <p className="text-sm font-bold text-slate-400 mt-1 mb-5 tracking-widest uppercase">
          CHAMPIONSHIP TOUR CIRCUIT
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950/80 border border-white/10 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">LAPS</div>
            <div className="text-lg font-black text-sky-400">2 LAPS</div>
          </div>
          <div className="bg-slate-950/80 border border-white/10 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">RIVALS</div>
            <div className="text-lg font-black text-amber-400">5 BIKES</div>
          </div>
          <div className="bg-slate-950/80 border border-white/10 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">TOP SPEED</div>
            <div className="text-lg font-black text-emerald-400">280+ KM/H</div>
          </div>
        </div>

        {/* Low-End Device Graphic Switcher */}
        <div className="text-left text-xs font-bold text-slate-400 mb-2 uppercase">
          GRAPHICS PRESET:
        </div>
        <div className="flex gap-2 mb-6">
          {(['low', 'medium', 'high'] as QualityTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setQuality(tier)}
              className={`flex-1 py-2 text-xs font-black rounded-md border uppercase transition-all cursor-pointer ${
                quality === tier
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-500/40'
                  : 'bg-slate-950/80 border-white/15 text-slate-400 hover:text-white hover:border-white/30'
              }`}
            >
              {tier === 'low' ? 'LOW (FAST)' : tier === 'medium' ? 'BALANCED' : 'ULTRA HD'}
            </button>
          ))}
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 border border-sky-300 rounded-lg font-black text-lg text-white shadow-lg shadow-sky-600/40 active:scale-98 transition-transform cursor-pointer"
        >
          START GRAND PRIX
        </button>

        <p className="text-xs text-slate-500 mt-4">
          Mobile: Touch pedals & steer buttons • Desktop: WASD / Arrows, Space (Brake), Shift (NOS), K (Kick)
        </p>
      </div>
    </div>
  );
}
