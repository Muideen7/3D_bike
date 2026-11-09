'use client';

import React from 'react';
import { useControlStore } from '@/store/useControlStore';
import { soundEngine } from '@/audio/SoundEngine';

export function BottomPedals() {
  const brake = useControlStore((s) => s.brake);
  const throttle = useControlStore((s) => s.throttle);
  const setInput = useControlStore((s) => s.setInput);

  const startBrake = (e: React.PointerEvent) => {
    e.preventDefault();
    soundEngine.init();
    soundEngine.resume();
    setInput('brake', true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
  };

  const stopBrake = (e: React.PointerEvent) => {
    e.preventDefault();
    setInput('brake', false);
  };

  const startThrottle = (e: React.PointerEvent) => {
    e.preventDefault();
    soundEngine.init();
    soundEngine.resume();
    setInput('throttle', true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
  };

  const stopThrottle = (e: React.PointerEvent) => {
    e.preventDefault();
    setInput('throttle', false);
  };

  return (
    <div className="flex justify-between items-end w-full px-4 pb-4 pointer-events-none">
      {/* Bottom-Left: Large Circular Brake Lever Button */}
      <button
        onPointerDown={startBrake}
        onPointerUp={stopBrake}
        onPointerLeave={stopBrake}
        className={`w-21 h-21 sm:w-24 sm:h-24 rounded-full border-3.5 flex flex-col items-center justify-center transition-all shadow-xl pointer-events-auto select-none backdrop-blur-md ${
          brake
            ? 'scale-90 border-emerald-400 bg-slate-950/95 shadow-[0_0_28px_rgba(52,211,153,0.95)]'
            : 'border-emerald-400/80 bg-slate-950/85 shadow-[0_0_18px_rgba(52,211,153,0.55)] active:scale-95'
        }`}
        title="Brake Lever (Hold)"
      >
        <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-14 sm:h-14">
          <circle cx="78" cy="35" r="9" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
          <path
            d="M72 37 C 55 42, 38 52, 22 68 C 16 73, 13 80, 20 84 C 27 88, 33 82, 38 76 C 50 63, 62 50, 75 43 Z"
            fill="#ffffff"
          />
          <rect x="74" y="24" width="16" height="8" rx="3" fill="#cbd5e1" />
          <text
            x="50"
            y="94"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="bold"
            fill="#4ade80"
            letterSpacing="1"
          >
            BRAKE
          </text>
        </svg>
      </button>

      {/* Speedometer Spacer - sits in center between pedals */}
      <div className="flex-1 max-w-xs" />

      {/* Bottom-Right: Large Circular Twist Throttle Grip Button */}
      <button
        onPointerDown={startThrottle}
        onPointerUp={stopThrottle}
        onPointerLeave={stopThrottle}
        className={`w-21 h-21 sm:w-24 sm:h-24 rounded-full border-3.5 flex flex-col items-center justify-center transition-all shadow-xl pointer-events-auto select-none backdrop-blur-md ${
          throttle
            ? 'scale-90 border-emerald-400 bg-slate-950/95 shadow-[0_0_28px_rgba(52,211,153,0.95)]'
            : 'border-emerald-400/80 bg-slate-950/85 shadow-[0_0_18px_rgba(52,211,153,0.55)] active:scale-95'
        }`}
        title="Throttle Accelerate (Hold)"
      >
        <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-14 sm:h-14">
          <rect x="25" y="44" width="48" height="20" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <line x1="33" y1="44" x2="33" y2="64" stroke="#0f172a" strokeWidth="2" />
          <line x1="41" y1="44" x2="41" y2="64" stroke="#0f172a" strokeWidth="2" />
          <line x1="49" y1="44" x2="49" y2="64" stroke="#0f172a" strokeWidth="2" />
          <line x1="57" y1="44" x2="57" y2="64" stroke="#0f172a" strokeWidth="2" />
          <line x1="65" y1="44" x2="65" y2="64" stroke="#0f172a" strokeWidth="2" />
          <rect x="15" y="40" width="10" height="28" rx="2" fill="#cbd5e1" />
          <path d="M72 44 Q 85 40 82 26" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
          <text
            x="50"
            y="94"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="11"
            fontWeight="bold"
            fill="#4ade80"
            letterSpacing="1"
          >
            RACE
          </text>
        </svg>
      </button>
    </div>
  );
}
