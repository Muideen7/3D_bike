'use client';

import React from 'react';
import { TrackMesh } from './Track/TrackMesh';
import { Kerbs } from './Track/Kerbs';
import { Gantry } from './Track/Gantry';
import { Scenery } from './Track/Scenery';
import { PlayerBike } from './Bike/PlayerBike';
import { AIRacerBike } from './Bike/AIRacerBike';
import { GameCamera } from './Camera/GameCamera';
import { useSettingsStore } from '@/store/useSettingsStore';

const AI_RACERS = [
  { id: 'ai-1', name: 'Blue Falcon',  bikeColor: '#2563eb', riderColor: '#1d4ed8', initialU: 0.02, laneTarget: -2.8, speedFactor: 0.96 },
  { id: 'ai-2', name: 'White Flash',  bikeColor: '#f8fafc', riderColor: '#cbd5e1', initialU: 0.045, laneTarget: 2.5, speedFactor: 0.94 },
  { id: 'ai-3', name: 'Ninja Green',  bikeColor: '#16a34a', riderColor: '#15803d', initialU: 0.07, laneTarget: -0.8, speedFactor: 0.95 },
  { id: 'ai-4', name: 'Yellow Hornet',bikeColor: '#eab308', riderColor: '#ca8a04', initialU: 0.095, laneTarget: 3.2, speedFactor: 0.93 },
  { id: 'ai-5', name: 'KTM Orange',   bikeColor: '#f97316', riderColor: '#c2410c', initialU: 0.12, laneTarget: 1.0, speedFactor: 0.97 },
];

export function Scene() {
  const quality = useSettingsStore((s) => s.quality);
  const enableShadows = quality !== 'low';

  return (
    <>
      {/* Summer Sky & Fog */}
      <color attach="background" args={['#7ec0ee']} />
      <fogExp2 attach="fog" args={['#9bd0f5', 0.0018]} />

      {/* Lighting */}
      <hemisphereLight args={['#ffffff', '#445566', 0.85]} />
      <directionalLight
        position={[80, 140, 60]}
        intensity={1.15}
        castShadow={enableShadows}
        shadow-mapSize-width={quality === 'high' ? 1024 : 512}
        shadow-mapSize-height={quality === 'high' ? 1024 : 512}
        shadow-bias={-0.0004}
      />

      {/* Track & World Environment */}
      <TrackMesh />
      <Kerbs />
      <Gantry />
      <Scenery />

      {/* Racers */}
      <PlayerBike />
      {AI_RACERS.map((ai) => (
        <AIRacerBike key={ai.id} {...ai} />
      ))}

      {/* Dynamic Game Camera */}
      <GameCamera />
    </>
  );
}
