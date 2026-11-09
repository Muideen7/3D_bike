'use client';

import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { LeftActionStack } from './LeftActionStack';
import { RightActionStack } from './RightActionStack';
import { Speedometer } from './Speedometer';
import { BottomPedals } from './BottomPedals';
import { StartModal } from './Modals/StartModal';
import { PauseModal } from './Modals/PauseModal';
import { FinishModal } from './Modals/FinishModal';
import { useRaceStore } from '@/store/useRaceStore';
import { useControlStore } from '@/store/useControlStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';

export function HeadsUpDisplay() {
  const gameState = useRaceStore((s) => s.gameState);
  const countdown = useRaceStore((s) => s.countdown);
  const setGameState = useRaceStore((s) => s.setGameState);

  const speedKmh = useRaceStore((s) => s.speedKmh);
  const nos = useControlStore((s) => s.nos);
  const setInput = useControlStore((s) => s.setInput);
  const cycleCamera = useControlStore((s) => s.cycleCamera);

  const toastMessage = useSettingsStore((s) => s.toastMessage);
  const clearToast = useSettingsStore((s) => s.clearToast);

  // Desktop Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.init();
      soundEngine.resume();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') setInput('throttle', true);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setInput('brake', true);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setInput('steerLeft', true);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setInput('steerRight', true);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') setInput('nos', true);
      if (e.code === 'Space') setInput('brake', true);
      if (e.code === 'KeyK') {
        setInput('kick', true);
        setTimeout(() => setInput('kick', false), 450);
      }
      if (e.code === 'KeyC') cycleCamera();
      if (e.code === 'KeyP') {
        const cur = useRaceStore.getState().gameState;
        if (cur === 'RACING') setGameState('PAUSED');
        else if (cur === 'PAUSED') setGameState('RACING');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setInput('throttle', false);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setInput('brake', false);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setInput('steerLeft', false);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setInput('steerRight', false);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') setInput('nos', false);
      if (e.code === 'Space') setInput('brake', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setInput, cycleCamera, setGameState]);

  // Toast Auto-Clear
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(clearToast, 2200);
    return () => clearTimeout(t);
  }, [toastMessage, clearToast]);

  const isSpeedBlurred = nos || speedKmh > 230;

  return (
    <div className="absolute inset-0 z-10 w-full h-full flex flex-col justify-between pointer-events-none select-none overflow-hidden">
      {/* Speed Lines FX during NOS / Extreme Top Speed */}
      <div
        className={`absolute inset-0 pointer-events-none z-1 transition-opacity duration-200 ${
          isSpeedBlurred ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(6,182,212,0.15) 80%, rgba(6,182,212,0.35) 100%)',
        }}
      />

      {/* Countdown Big Overlay */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl sm:text-9xl font-black text-amber-400 drop-shadow-[0_0_35px_rgba(250,204,21,0.9)] z-40 pointer-events-none animate-pulse">
          {countdown > 0 ? countdown : 'GO!'}
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-sky-400 text-white font-bold text-sm sm:text-base px-6 py-2 rounded-full shadow-2xl z-40 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Top HUD Bar */}
      <TopBar onPause={() => setGameState('PAUSED')} />

      {/* Middle Flank Control Stacks */}
      <div className="flex justify-between items-center w-full px-4 sm:px-6 pointer-events-none">
        <LeftActionStack />
        <RightActionStack />
      </div>

      {/* Bottom Area: Centered Speedometer + Pedals */}
      <div className="flex flex-col items-center w-full">
        <Speedometer />
        <BottomPedals />
      </div>

      {/* Modals */}
      <StartModal />
      <PauseModal />
      <FinishModal />
    </div>
  );
}
