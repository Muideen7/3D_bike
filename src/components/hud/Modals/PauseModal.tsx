'use client';

import React from 'react';
import { useRaceStore } from '@/store/useRaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';
import { QualityTier } from '@/types/controls.types';

export function PauseModal() {
  const gameState = useRaceStore((s) => s.gameState);
  const setGameState = useRaceStore((s) => s.setGameState);
  const resetRace = useRaceStore((s) => s.resetRace);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);

  if (gameState !== 'PAUSED') return null;

  const handleResume = () => {
    soundEngine.resume();
    setGameState('RACING');
  };

  const handleRestart = () => {
    resetRace();
    setGameState('START');
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    toggleSound();
    soundEngine.setEnabled(next);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900/90 border border-white/20 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
        <h2 className="text-3xl font-black tracking-wider text-white uppercase mb-1">
          RACE PAUSED
        </h2>
        <p className="text-xs font-bold text-slate-400 mb-5 tracking-widest uppercase">
          PIT LANE STOP
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResume}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 border border-sky-300 rounded-lg font-black text-white shadow-lg active:scale-98 transition-transform cursor-pointer"
          >
            RESUME RACE
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-white/20 rounded-lg font-bold text-slate-200 active:scale-98 transition-transform cursor-pointer"
          >
            RESTART RACE
          </button>

          <button
            type="button"
            onClick={handleSoundToggle}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-white/20 rounded-lg font-bold text-slate-200 active:scale-98 transition-transform cursor-pointer"
          >
            SOUND: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="text-left text-xs font-bold text-slate-400 mt-5 mb-2 uppercase">
          GRAPHICS PRESET:
        </div>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as QualityTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setQuality(tier)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md border uppercase transition-all cursor-pointer ${
                quality === tier
                  ? 'bg-sky-600 border-sky-400 text-white'
                  : 'bg-slate-950/80 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
