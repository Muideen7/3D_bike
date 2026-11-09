'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CircuitMath, TRACK_SPLINE, TRACK_LENGTH } from '@/physics/TrackSpline';
import { useRaceStore } from '@/store/useRaceStore';

interface AIRacerBikeProps {
  id: string;
  name: string;
  initialU: number;
  laneTarget: number;
  speedFactor: number;
  bikeColor: string;
  riderColor: string;
}

export function AIRacerBike({
  id,
  initialU,
  laneTarget,
  speedFactor,
  bikeColor,
  riderColor,
}: AIRacerBikeProps) {
  const rootRef = useRef<THREE.Group>(null);
  const frontForkRef = useRef<THREE.Group>(null);
  const frontTireRef = useRef<THREE.Mesh>(null);
  const rearTireRef = useRef<THREE.Mesh>(null);
  const riderRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  const gameState = useRaceStore((s) => s.gameState);
  const lapRef = useRef(1);

  const stateRef = useRef({
    u: initialU,
    laneOffset: laneTarget,
    speed: 52 * speedFactor,
    leanAngle: 0,
  });

  useEffect(() => {
    if (gameState === 'START') {
      const ai = stateRef.current;
      ai.u = initialU;
      ai.laneOffset = laneTarget;
      ai.speed = 52 * speedFactor;
      ai.leanAngle = 0;
      lapRef.current = 1;
    }
  }, [gameState, initialU, laneTarget, speedFactor]);

  const materials = useMemo(() => {
    return {
      fairing: new THREE.MeshStandardMaterial({ color: bikeColor, roughness: 0.25, metalness: 0.2 }),
      whiteAccent: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }),
      carbon: new THREE.MeshStandardMaterial({ color: '#161a20', roughness: 0.45, metalness: 0.3 }),
      chassisAlu: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.8 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.55, metalness: 0.6 }),
      goldOhlins: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.28, metalness: 0.85 }),
      chromeSteel: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.15, metalness: 0.95 }),
      titaniumBlue: new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.35, metalness: 0.75 }),
      windscreen: new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.45, roughness: 0.1 }),
      tires: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85, metalness: 0.05 }),
      racingRim: new THREE.MeshStandardMaterial({ color: bikeColor, roughness: 0.3, metalness: 0.5 }),
      headlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      taillight: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      // Rider materials
      suitPrimary: new THREE.MeshStandardMaterial({ color: riderColor, roughness: 0.55 }),
      suitDark: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7 }),
      helmetShell: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 }),
      visorDark: new THREE.MeshStandardMaterial({ color: '#030712', roughness: 0.1, metalness: 0.9 }),
      kneePuck: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }),
      goldChain: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4, metalness: 0.8 }),
      springYellow: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35 }),
    };
  }, [bikeColor, riderColor]);

  useFrame((_, delta) => {
    if (!rootRef.current) return;
    const ai = stateRef.current;
    const dt = Math.min(delta, 0.1);

    if (gameState === 'RACING') {
      // Check if this AI racer was kicked / impacted
      if (rootRef.current.userData.impactTimer > 0) {
        rootRef.current.userData.impactTimer -= dt;
        ai.speed = Math.max(22, ai.speed - dt * 35);
        ai.leanAngle += Math.sin(Date.now() * 0.025) * 0.35; // Wobble FX
      } else {
        ai.speed = THREE.MathUtils.lerp(ai.speed, 52 * speedFactor, dt * 2.0);
      }

      const prevU = ai.u;
      ai.u = (ai.u + (ai.speed * dt) / TRACK_LENGTH) % 1.0;

      if (prevU > 0.85 && ai.u < 0.15) {
        lapRef.current += 1;
      }

      // Gentle lane oscillation
      ai.laneOffset = THREE.MathUtils.lerp(ai.laneOffset, laneTarget, dt * 0.5);

      // Track banking
      const aheadU = (ai.u + 0.015) % 1.0;
      const curPt = TRACK_SPLINE.getPointAt(ai.u);
      const aheadPt = TRACK_SPLINE.getPointAt(aheadU);
      const frame = CircuitMath.getVehicleFrame(ai.u, ai.laneOffset);

      const toAhead = aheadPt.clone().sub(curPt).normalize();
      const turnDot = frame.normal.dot(toAhead);
      ai.leanAngle = THREE.MathUtils.lerp(ai.leanAngle, turnDot * 1.4, dt * 4.0);

      // Spin tires
      const tireSpin = ai.speed * dt * 8.0;
      if (frontTireRef.current) frontTireRef.current.rotation.x += tireSpin;
      if (rearTireRef.current) rearTireRef.current.rotation.x += tireSpin;
    }

    const currentFrame = CircuitMath.getVehicleFrame(ai.u, ai.laneOffset);
    rootRef.current.position.copy(currentFrame.position);
    rootRef.current.quaternion.copy(currentFrame.quaternion);
    rootRef.current.rotateZ(ai.leanAngle);

    // Dynamic Rider Hang-off Pose
    if (riderRef.current) {
      riderRef.current.position.x = ai.leanAngle * -0.2;
    }
    if (legLRef.current && legRRef.current) {
      if (ai.leanAngle < -0.15) {
        legLRef.current.rotation.z = -0.6;
        legLRef.current.position.x = -0.34;
        legRRef.current.rotation.z = 0;
        legRRef.current.position.x = 0.22;
      } else if (ai.leanAngle > 0.15) {
        legRRef.current.rotation.z = 0.6;
        legRRef.current.position.x = 0.34;
        legLRef.current.rotation.z = 0;
        legLRef.current.position.x = -0.22;
      } else {
        legLRef.current.rotation.z = 0;
        legLRef.current.position.x = -0.22;
        legRRef.current.rotation.z = 0;
        legRRef.current.position.x = 0.22;
      }
    }

    // Publish progress & position for live ranking & kick combat
    rootRef.current.userData.progress = (lapRef.current - 1) + ai.u;
    rootRef.current.userData.u = ai.u;
    rootRef.current.userData.laneOffset = ai.laneOffset;
  });

  return (
    <group ref={rootRef} name={`AIRacer_${id}`}>
      {/* 1. Aluminum Chassis Frame */}
      <mesh position={[-0.22, 0.68, -0.05]} rotation={[0.42, 0, -0.1]} material={materials.chassisAlu} castShadow>
        <boxGeometry args={[0.07, 0.14, 0.95]} />
      </mesh>
      <mesh position={[0.22, 0.68, -0.05]} rotation={[0.42, 0, 0.1]} material={materials.chassisAlu} castShadow>
        <boxGeometry args={[0.07, 0.14, 0.95]} />
      </mesh>

      {/* 2. Engine Block & Titanium Exhaust */}
      <mesh position={[0, 0.45, -0.02]} material={materials.darkMetal} castShadow>
        <boxGeometry args={[0.44, 0.38, 0.56]} />
      </mesh>
      <group position={[0.26, 0.52, 0.58]} rotation={[0.38, -0.08, 0]}>
        <mesh material={materials.titaniumBlue}>
          <cylinderGeometry args={[0.065, 0.08, 0.82, 10]} />
        </mesh>
      </group>
      <mesh position={[0, 0.28, -0.08]} material={materials.carbon}>
        <boxGeometry args={[0.42, 0.14, 0.75]} />
      </mesh>

      {/* 3. Aerodynamic Front Fairing with MotoGP Winglets */}
      <mesh position={[0, 0.88, -0.66]} rotation={[-Math.PI * 0.42, 0, 0]} material={materials.fairing} castShadow>
        <coneGeometry args={[0.36, 0.78, 6]} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-0.14, 0.86, -0.92]} material={materials.headlight}>
        <boxGeometry args={[0.11, 0.05, 0.04]} />
      </mesh>
      <mesh position={[0.14, 0.86, -0.92]} material={materials.headlight}>
        <boxGeometry args={[0.11, 0.05, 0.04]} />
      </mesh>
      {/* Winglets */}
      <mesh position={[-0.34, 0.84, -0.68]} rotation={[0.15, 0.2, -0.22]} material={materials.carbon}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
      </mesh>
      <mesh position={[0.34, 0.84, -0.68]} rotation={[0.15, -0.2, 0.22]} material={materials.carbon}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
      </mesh>
      {/* Bubble Windscreen */}
      <mesh position={[0, 1.1, -0.68]} rotation={[-Math.PI * 0.28, 0, 0]} material={materials.windscreen}>
        <planeGeometry args={[0.34, 0.44]} />
      </mesh>
      {/* Side Fairing */}
      <mesh position={[-0.24, 0.66, -0.26]} material={materials.fairing}>
        <boxGeometry args={[0.05, 0.45, 0.72]} />
      </mesh>
      <mesh position={[0.24, 0.66, -0.26]} material={materials.fairing}>
        <boxGeometry args={[0.05, 0.45, 0.72]} />
      </mesh>
      {/* Fuel Tank */}
      <mesh position={[0, 0.94, -0.18]} material={materials.fairing} castShadow>
        <boxGeometry args={[0.42, 0.34, 0.56]} />
      </mesh>
      {/* Seat */}
      <mesh position={[0, 0.88, 0.16]} material={materials.suitDark}>
        <boxGeometry args={[0.3, 0.08, 0.36]} />
      </mesh>
      {/* Tail Cowl & Light */}
      <mesh position={[0, 0.92, 0.62]} rotation={[Math.PI * 0.44, 0, 0]} material={materials.fairing}>
        <coneGeometry args={[0.26, 0.8, 5]} />
      </mesh>
      <mesh position={[0, 0.96, 0.94]} material={materials.taillight}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
      </mesh>

      {/* 4. Front Forks & Front Wheel */}
      <group ref={frontForkRef} position={[0, 0.62, -0.66]}>
        <mesh position={[-0.16, 0.05, 0]} rotation={[0.32, 0, 0]} material={materials.goldOhlins}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 10]} />
        </mesh>
        <mesh position={[0.16, 0.05, 0]} rotation={[0.32, 0, 0]} material={materials.goldOhlins}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 10]} />
        </mesh>
        <mesh position={[0, 0.36, -0.06]} rotation={[0, 0, Math.PI / 2]} material={materials.darkMetal}>
          <cylinderGeometry args={[0.018, 0.018, 0.64, 8]} />
        </mesh>
        {/* Front Wheel */}
        <group position={[0, -0.24, -0.16]}>
          <mesh ref={frontTireRef} rotation={[0, 0, Math.PI / 2]} material={materials.tires} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.15, 18]} />
            <mesh material={materials.racingRim}>
              <cylinderGeometry args={[0.24, 0.24, 0.16, 12]} />
            </mesh>
          </mesh>
          <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeSteel}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 14]} />
          </mesh>
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeSteel}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 14]} />
          </mesh>
        </group>
      </group>

      {/* 5. Rear Swingarm & Rear Wheel */}
      <mesh position={[0, 0.38, 0.44]} material={materials.chassisAlu}>
        <boxGeometry args={[0.34, 0.11, 0.74]} />
      </mesh>
      <mesh position={[0, 0.55, 0.24]} rotation={[0.4, 0, 0]} material={materials.springYellow}>
        <cylinderGeometry args={[0.045, 0.045, 0.26, 8]} />
      </mesh>
      <mesh position={[-0.14, 0.38, 0.46]} material={materials.goldChain}>
        <boxGeometry args={[0.02, 0.04, 0.65]} />
      </mesh>
      <group position={[0, 0.4, 0.8]}>
        <mesh ref={rearTireRef} rotation={[0, 0, Math.PI / 2]} material={materials.tires} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.24, 18]} />
          <mesh material={materials.racingRim}>
            <cylinderGeometry args={[0.24, 0.24, 0.25, 12]} />
          </mesh>
        </mesh>
      </group>

      {/* 6. AI Rider in Racing Leathers & Helmet */}
      <group ref={riderRef} position={[0, 0.9, 0.12]}>
        {/* Torso */}
        <mesh position={[0, 0.2, -0.16]} rotation={[0.56, 0, 0]} material={materials.suitPrimary} castShadow>
          <boxGeometry args={[0.38, 0.42, 0.58]} />
        </mesh>
        <mesh position={[0, 0.44, 0.06]} rotation={[Math.PI * 0.45, 0, 0]} material={materials.suitDark}>
          <coneGeometry args={[0.13, 0.38, 6]} />
        </mesh>
        {/* Helmet */}
        <group position={[0, 0.48, -0.42]}>
          <mesh scale={[1, 1.15, 1.25]} material={materials.helmetShell} castShadow>
            <sphereGeometry args={[0.22, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.02, -0.16]} material={materials.visorDark}>
            <boxGeometry args={[0.28, 0.1, 0.14]} />
          </mesh>
        </group>
        {/* Arms */}
        <mesh position={[-0.26, 0.22, -0.36]} rotation={[0.82, 0, -0.38]} material={materials.suitPrimary}>
          <cylinderGeometry args={[0.06, 0.055, 0.48, 8]} />
        </mesh>
        <mesh position={[0.26, 0.22, -0.36]} rotation={[0.82, 0, 0.38]} material={materials.suitPrimary}>
          <cylinderGeometry args={[0.06, 0.055, 0.48, 8]} />
        </mesh>
        {/* Articulated Legs */}
        <group ref={legLRef} position={[-0.22, -0.04, 0.04]}>
          <mesh rotation={[-0.48, 0, 0]} material={materials.suitDark}>
            <boxGeometry args={[0.13, 0.32, 0.16]} />
          </mesh>
          <mesh position={[-0.1, -0.08, 0.1]} material={materials.kneePuck}>
            <boxGeometry args={[0.07, 0.09, 0.07]} />
          </mesh>
          <mesh position={[0, -0.22, 0.16]} rotation={[0.3, 0, 0]} material={materials.darkMetal}>
            <boxGeometry args={[0.11, 0.14, 0.24]} />
          </mesh>
        </group>
        <group ref={legRRef} position={[0.22, -0.04, 0.04]}>
          <mesh rotation={[-0.48, 0, 0]} material={materials.suitDark}>
            <boxGeometry args={[0.13, 0.32, 0.16]} />
          </mesh>
          <mesh position={[0.1, -0.08, 0.1]} material={materials.kneePuck}>
            <boxGeometry args={[0.07, 0.09, 0.07]} />
          </mesh>
          <mesh position={[0, -0.22, 0.16]} rotation={[0.3, 0, 0]} material={materials.darkMetal}>
            <boxGeometry args={[0.11, 0.14, 0.24]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
