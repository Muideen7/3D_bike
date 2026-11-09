'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_SPLINE, ROAD_WIDTH } from '@/physics/TrackSpline';
import { useRaceStore } from '@/store/useRaceStore';

export function Gantry() {
  const gameState = useRaceStore((s) => s.gameState);
  const countdown = useRaceStore((s) => s.countdown);

  const { position, rotation, bannerTexture } = useMemo(() => {
    const startPt = TRACK_SPLINE.getPointAt(0.001);
    const tangent = TRACK_SPLINE.getTangentAt(0.001).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const ctx = bannerCanvas.getContext('2d')!;

    // Carbon-fiber styled dark gantry plate
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);

    // Chequered edge borders
    const sqSize = 16;
    for (let x = 0; x < 512; x += sqSize) {
      for (let y = 0; y < 32; y += sqSize) {
        ctx.fillStyle = (Math.floor(x / sqSize) + Math.floor(y / sqSize)) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, sqSize, sqSize);
        ctx.fillRect(x, 128 - y - sqSize, sqSize, sqSize);
      }
    }

    // Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 START / FINISH 🏁', 256, 75);

    const tex = new THREE.CanvasTexture(bannerCanvas);

    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const euler = new THREE.Euler().setFromQuaternion(quat);

    return {
      position: [startPt.x, startPt.y, startPt.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      bannerTexture: tex,
    };
  }, []);

  // Starting Lights sequence logic
  const isLightsActive = gameState === 'COUNTDOWN';
  const redLightsCount = isLightsActive ? 4 - countdown : 0;
  const isGreen = gameState === 'RACING';

  return (
    <group position={position} rotation={rotation}>
      {/* Left Pillar */}
      <mesh position={[-ROAD_WIDTH * 0.5 - 1.6, 4.0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 8.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[ROAD_WIDTH * 0.5 + 1.6, 4.0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 8.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Top Cross Beam */}
      <mesh position={[0, 8.1, 0]} castShadow>
        <boxGeometry args={[ROAD_WIDTH + 4.5, 1.4, 1.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Gantry Banner Plate */}
      <mesh position={[0, 8.1, 0.72]}>
        <planeGeometry args={[ROAD_WIDTH + 1.2, 1.8]} />
        <meshBasicMaterial map={bannerTexture} />
      </mesh>

      {/* 5-Light Starting Sequence Cluster */}
      <group position={[0, 6.7, 0.5]}>
        {[-3, -1.5, 0, 1.5, 3].map((xOffset, idx) => {
          const isRedLit = isLightsActive && idx < redLightsCount;
          const lightColor = isGreen ? '#22c55e' : isRedLit ? '#ef4444' : '#475569';
          return (
            <group key={idx} position={[xOffset, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.9, 0.9, 0.4]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <mesh position={[0, 0, 0.22]}>
                <circleGeometry args={[0.32, 16]} />
                <meshBasicMaterial color={lightColor} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
