'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ExhaustFXProps {
  active: boolean;
}

export function ExhaustFX({ active }: ExhaustFXProps) {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!flameRef.current) return;
    if (active) {
      flameRef.current.visible = true;
      const flicker = 0.85 + Math.random() * 0.3;
      flameRef.current.scale.set(flicker, flicker * (1.2 + Math.random() * 0.4), flicker);
    } else {
      flameRef.current.visible = false;
    }
  });

  return (
    <group position={[0.24, 0.52, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={flameRef} visible={false}>
        <coneGeometry args={[0.09, 0.65, 6]} />
        <meshBasicMaterial color="#00f7ff" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
