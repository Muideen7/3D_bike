'use client';

import React from 'react';
import { Wrench, Video, ChevronsLeft } from 'lucide-react';
import { useControlStore } from '@/store/useControlStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';

export function LeftActionStack() {
  const steerLeft = useControlStore((s) => s.steerLeft);
  const setInput = useControlStore((s) => s.setInput);
  const cycleCamera = useControlStore((s) => s.cycleCamera);
  const cameraMode = useControlStore((s) => s.cameraMode);
  const showToast = useSettingsStore((s) => s.showToast);

  const handleWrench = () => {
    soundEngine.init();
    soundEngine.resume();
    showToast('ENGINE TUNED! +20% TORQUE');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  };

  const handleCamera = () => {
    soundEngine.init();
    soundEngine.resume();
    cycleCamera();
    showToast(`CAMERA: ${cameraMode}`);
  };

  const startSteer = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    soundEngine.init();
    soundEngine.resume();
    setInput('steerLeft', true);
  };

  const stopSteer = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setInput('steerLeft', false);
  };

  return (
    <div className="flex flex-col gap-4 pointer-events-auto">
      {/* 1. Wrench / Engine Tune */}
      <button
        onClick={handleWrench}
        className="w-12 h-12 bg-slate-900/75 border border-white/30 rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform backdrop-blur-md"
        title="Engine Tune / Supercharge"
      >
        <Wrench className="w-6 h-6 text-white" />
      </button>

      {/* 2. Camera Toggle */}
      <button
        onClick={handleCamera}
        className="w-12 h-12 bg-slate-900/75 border border-white/30 rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform backdrop-blur-md"
        title="Toggle Camera View"
      >
        <Video className="w-6 h-6 text-white" />
      </button>

      {/* 3. Steer Left (<<) */}
      <button
        onPointerDown={startSteer}
        onPointerUp={stopSteer}
        onPointerLeave={stopSteer}
        className={`w-12 h-12 border rounded-lg flex items-center justify-center shadow-lg transition-all backdrop-blur-md select-none ${
          steerLeft
            ? 'bg-sky-600/90 border-sky-400 scale-95 shadow-sky-500/50'
            : 'bg-slate-900/75 border-white/30 active:scale-90'
        }`}
        title="Steer Left"
      >
        <ChevronsLeft className="w-7 h-7 text-white stroke-[2.5]" />
      </button>
    </div>
  );
}
