'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useSettingsStore } from '@/store/useSettingsStore';

export function RacingCanvas() {
  const quality = useSettingsStore((s) => s.quality);

  const dpr = quality === 'low' ? 1.0 : quality === 'medium' ? 1.25 : 1.5;

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas
        camera={{ position: [0, 3.2, 6.4], fov: 60, near: 0.2, far: 2400 }}
        dpr={dpr}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance',
        }}
        shadows={quality !== 'low'}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
