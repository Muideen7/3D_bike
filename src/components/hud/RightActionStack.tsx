'use client';

import React from 'react';
import { ChevronsRight, Zap } from 'lucide-react';
import { useControlStore } from '@/store/useControlStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';

export function RightActionStack() {
  const steerRight = useControlStore((s) => s.steerRight);
  const nos = useControlStore((s) => s.nos);
  const aeroTuck = useControlStore((s) => s.aeroTuck);
  const setInput = useControlStore((s) => s.setInput);
  const toggleAeroTuck = useControlStore((s) => s.toggleAeroTuck);
  const showToast = useSettingsStore((s) => s.showToast);

  const handleAero = () => {
    soundEngine.init();
    soundEngine.resume();
    toggleAeroTuck();
    showToast(!aeroTuck ? 'AERO RACING TUCK: ON' : 'UPRIGHT STANCE');
  };

  const handleKick = () => {
    soundEngine.init();
    soundEngine.resume();
    setInput('kick', true);
    setTimeout(() => setInput('kick', false), 450);
    showToast('KICK ATTACK!');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 20, 40]);
    }
  };

  const startSteer = (e: React.PointerEvent) => {
    e.preventDefault();
    soundEngine.init();
    soundEngine.resume();
    setInput('steerRight', true);
  };

  const stopSteer = (e: React.PointerEvent) => {
    e.preventDefault();
    setInput('steerRight', false);
  };

  const startNos = (e: React.PointerEvent) => {
    e.preventDefault();
    soundEngine.init();
    soundEngine.resume();
    setInput('nos', true);
  };

  const stopNos = (e: React.PointerEvent) => {
    e.preventDefault();
    setInput('nos', false);
  };

  return (
    <div className="flex flex-col items-end gap-4 pointer-events-auto">
      {/* 1. Helmet / Aero Tuck Stance */}
      <button
        onClick={handleAero}
        className={`w-12 h-12 border rounded-lg flex items-center justify-center shadow-lg transition-all backdrop-blur-md ${
          aeroTuck
            ? 'bg-sky-600 border-sky-300 shadow-sky-500/50'
            : 'bg-slate-900/75 border-white/30 active:scale-90'
        }`}
        title="Aero Racing Tuck"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M12 2a10 10 0 0 0-10 10c0 4.2 2.6 7.8 6.3 9.3.4.1.8-.2.8-.6v-2.3c0-.6.4-1.1 1-1.2 2.5-.4 4.5-.4 7 0 .6.1 1 .6 1 1.2v2.3c0 .4.4.7.8.6A10 10 0 0 0 12 2zm-4 8h8a2 2 0 0 1 2 2v2H6v-2a2 2 0 0 1 2-2z" />
        </svg>
      </button>

      {/* 2. NOS Nitro Booster (Hold) */}
      <button
        onPointerDown={startNos}
        onPointerUp={stopNos}
        onPointerLeave={stopNos}
        className={`w-12 h-12 border rounded-lg flex flex-col items-center justify-center shadow-lg transition-all select-none ${
          nos
            ? 'bg-cyan-500 border-cyan-300 scale-95 shadow-[0_0_20px_rgba(6,182,212,0.85)]'
            : 'bg-cyan-950/80 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
        }`}
        title="NOS Nitro Boost (Hold)"
      >
        <Zap className="w-4 h-4 text-cyan-300 fill-cyan-300" />
        <span className="text-[10px] font-black text-cyan-300 tracking-wider">NOS</span>
      </button>

      {/* 3. Combat Kick (Screenshot 3 Road Rash Attack) */}
      <button
        onClick={handleKick}
        className="w-12 h-12 bg-slate-900/75 border border-amber-500/60 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-90 transition-transform backdrop-blur-md"
        title="Kick Rivals"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-amber-400">
          <path d="M4 16l4-2 3 5 5-2-2-5 3-2-1-3-7 3-5 7z" />
        </svg>
      </button>

      {/* 4. Steer Right (>>) */}
      <button
        onPointerDown={startSteer}
        onPointerUp={stopSteer}
        onPointerLeave={stopSteer}
        className={`w-12 h-12 border rounded-lg flex items-center justify-center shadow-lg transition-all backdrop-blur-md select-none ${
          steerRight
            ? 'bg-sky-600/90 border-sky-400 scale-95 shadow-sky-500/50'
            : 'bg-slate-900/75 border-white/30 active:scale-90'
        }`}
        title="Steer Right"
      >
        <ChevronsRight className="w-7 h-7 text-white stroke-[2.5]" />
      </button>
    </div>
  );
}
