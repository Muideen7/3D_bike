'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useControlStore } from '@/store/useControlStore';
import { useRaceStore } from '@/store/useRaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { soundEngine } from '@/audio/SoundEngine';
import { CircuitMath, TRACK_LENGTH } from '@/physics/TrackSpline';
import { ExhaustFX } from './ExhaustFX';

export function PlayerBike() {
  const { scene } = useThree();
  const bikeRootRef = useRef<THREE.Group>(null);
  const frontForkRef = useRef<THREE.Group>(null);
  const frontTireRef = useRef<THREE.Mesh>(null);
  const rearTireRef = useRef<THREE.Mesh>(null);
  const riderRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  // Zustand bindings
  const throttle = useControlStore((s) => s.throttle);
  const brake = useControlStore((s) => s.brake);
  const steerLeft = useControlStore((s) => s.steerLeft);
  const steerRight = useControlStore((s) => s.steerRight);
  const nos = useControlStore((s) => s.nos);
  const aeroTuck = useControlStore((s) => s.aeroTuck);
  const kick = useControlStore((s) => s.kick);

  const gameState = useRaceStore((s) => s.gameState);
  const lap = useRaceStore((s) => s.lap);
  const totalLaps = useRaceStore((s) => s.totalLaps);
  const setLap = useRaceStore((s) => s.setLap);
  const setRank = useRaceStore((s) => s.setRank);
  const finishRace = useRaceStore((s) => s.finishRace);
  const updateTelemetry = useRaceStore((s) => s.updateTelemetry);
  const setRaceTime = useRaceStore((s) => s.setRaceTime);

  const showToast = useSettingsStore((s) => s.showToast);

  // Physics local state
  const physics = useRef({
    u: 0.001,
    laneOffset: 0,
    speed: 0,
    maxSpeed: 76, // ~274 km/h
    accel: 24,
    brakePower: 38,
    leanAngle: 0,
    gear: 1,
    rpm: 0.15,
    nosLevel: 100,
    engineBoost: 1.0,
    kickTimer: 0,
    lapStartTime: 0,
    bestLapTime: Infinity,
    raceStartTime: 0,
  });

  // Reset physics to starting grid when a new race is initiated
  useEffect(() => {
    if (gameState === 'START') {
      const p = physics.current;
      p.u = 0.001;
      p.laneOffset = 0;
      p.speed = 0;
      p.leanAngle = 0;
      p.gear = 1;
      p.rpm = 0.15;
      p.nosLevel = 100;
      p.kickTimer = 0;
      p.raceStartTime = 0;
      p.lapStartTime = 0;
    }
  }, [gameState]);

  // High-Quality Realistic Materials
  const materials = useMemo(() => {
    return {
      fairingRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.22, metalness: 0.2 }),
      fairingWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.24, metalness: 0.1 }),
      carbon: new THREE.MeshStandardMaterial({ color: '#161a20', roughness: 0.42, metalness: 0.4 }),
      chassisAlu: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.8 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.55, metalness: 0.6 }),
      clutchBronze: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.38, metalness: 0.7 }),
      goldOhlins: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.28, metalness: 0.85 }),
      chromeSteel: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.15, metalness: 0.95 }),
      titaniumBlue: new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3, metalness: 0.8 }),
      windscreen: new THREE.MeshStandardMaterial({ color: '#0284c7', transparent: true, opacity: 0.45, roughness: 0.1 }),
      tires: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85, metalness: 0.05 }),
      racingRim: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3, metalness: 0.5 }),
      caliperGold: new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.3, metalness: 0.8 }),
      headlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      taillight: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      dashboard: new THREE.MeshBasicMaterial({ color: '#0284c7' }),
      // Rider materials
      suitRed: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.55 }),
      suitWhite: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.55 }),
      suitDark: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7 }),
      helmetShell: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.1 }),
      visorDark: new THREE.MeshStandardMaterial({ color: '#030712', roughness: 0.1, metalness: 0.9 }),
      kneePuck: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }),
      goldChain: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.4, metalness: 0.8 }),
      springYellow: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35 }),
    };
  }, []);

  useFrame((_, delta) => {
    if (!bikeRootRef.current) return;
    const p = physics.current;
    const dt = Math.min(delta, 0.1);

    if (gameState === 'RACING') {
      if (p.raceStartTime === 0) {
        p.raceStartTime = performance.now();
        p.lapStartTime = p.raceStartTime;
      }
      const now = performance.now();
      const currentRaceTime = now - p.raceStartTime;
      setRaceTime(currentRaceTime);

      // 1. Throttle & Acceleration
      let currentAccel = 0;
      if (throttle) {
        currentAccel = p.accel * p.engineBoost;
        if (aeroTuck) currentAccel *= 1.15;
      }

      // 2. NOS Turbo
      let isNosActive = false;
      if (nos && p.nosLevel > 0 && throttle) {
        isNosActive = true;
        currentAccel += 32;
        p.nosLevel = Math.max(0, p.nosLevel - dt * 25);
      } else {
        p.nosLevel = Math.min(100, p.nosLevel + dt * 6);
      }

      // 3. Braking & Resistances
      let currentBrake = 0;
      if (brake) {
        currentBrake = p.brakePower;
      }
      const airDrag = 0.00085 * (p.speed * p.speed);
      const rollingFriction = 1.2;

      p.speed += (currentAccel - currentBrake - airDrag - rollingFriction) * dt;
      p.speed = Math.max(0, Math.min(p.speed, isNosActive ? 85 : p.maxSpeed));
      const speedKmh = p.speed * 3.6;

      // 4. Transmission Gears & RPM
      const gearThresholds = [0, 45, 95, 150, 205, 250];
      let activeGear = 1;
      for (let g = 1; g <= 6; g++) {
        if (speedKmh >= (gearThresholds[g - 1] || 0)) activeGear = g;
      }
      if (activeGear !== p.gear) {
        p.gear = activeGear;
        soundEngine.playGearShift();
      }
      const gearBase = gearThresholds[p.gear - 1] || 0;
      const gearNext = gearThresholds[p.gear] || 280;
      p.rpm = THREE.MathUtils.clamp((speedKmh - gearBase) / Math.max(20, gearNext - gearBase), 0.15, 1.0);

      // 5. Steering Math (Right moves right, Left moves left)
      let steerInput = 0;
      if (steerRight) steerInput += 1;
      if (steerLeft) steerInput -= 1;

      const steerSensitivity = THREE.MathUtils.clamp(1.2 - (p.speed / 90) * 0.45, 0.4, 1.2);
      p.laneOffset += steerInput * steerSensitivity * 8.5 * dt;
      p.laneOffset = CircuitMath.clampLane(p.laneOffset);

      // Lean Angle roll banking
      const targetLean = steerInput * -0.78;
      p.leanAngle = THREE.MathUtils.lerp(p.leanAngle, targetLean, dt * 8.0);

      // 6. Spline Progression & Lap Crossing
      const prevU = p.u;
      p.u = (p.u + (p.speed * dt) / TRACK_LENGTH) % 1.0;

      if (prevU > 0.85 && p.u < 0.15) {
        // Lap Completed
        const lapDuration = currentRaceTime - p.lapStartTime;
        if (lapDuration < p.bestLapTime) p.bestLapTime = lapDuration;
        p.lapStartTime = currentRaceTime;

        if (lap < totalLaps) {
          setLap(lap + 1);
          showToast(`LAP ${lap + 1}! FINAL LAP!`);
          soundEngine.playBeep(true);
        } else {
          finishRace(p.bestLapTime, currentRaceTime);
          soundEngine.playBeep(true);
        }
      }

      // Kick Combat
      if (kick && p.kickTimer <= 0) {
        p.kickTimer = 0.45;
        soundEngine.playImpact();

        // Check if any AI bike is nearby (within kicking range on the right side)
        scene.children.forEach((child) => {
          if (child.name.startsWith('AIRacer_') && child.userData && typeof child.userData.u === 'number') {
            const du = Math.abs(child.userData.u - p.u);
            const dLane = child.userData.laneOffset - p.laneOffset;
            if (du < 0.015 && dLane > -0.5 && dLane < 3.5) {
              child.userData.impactTimer = 1.2;
              showToast('💥 RIVAL KNOCKED BACK!');
            }
          }
        });
      }
      if (p.kickTimer > 0) {
        p.kickTimer -= dt;
      }

      // Telemetry store update
      updateTelemetry({
        speedKmh,
        rpm: p.rpm,
        gear: p.gear,
        nosLevel: p.nosLevel,
      });

      // Sound update
      soundEngine.update(p.rpm, speedKmh, brake, isNosActive);

      // Live dynamic ranking vs AI racers
      const playerProgress = (lap - 1) + p.u;
      let calculatedRank = 1;
      scene.children.forEach((child) => {
        if (child.name.startsWith('AIRacer_') && child.userData && typeof child.userData.progress === 'number') {
          if (child.userData.progress > playerProgress) {
            calculatedRank++;
          }
        }
      });
      setRank(calculatedRank);
    }

    // 7. Synchronize 3D Transforms with Track Geometry
    const frame = CircuitMath.getVehicleFrame(p.u, p.laneOffset);
    bikeRootRef.current.position.copy(frame.position);
    bikeRootRef.current.quaternion.copy(frame.quaternion);

    // Apply Cornering Lean Roll
    bikeRootRef.current.rotateZ(p.leanAngle);

    // Turn handlebars
    if (frontForkRef.current) {
      let steerInput = 0;
      if (steerRight) steerInput += 1;
      if (steerLeft) steerInput -= 1;
      frontForkRef.current.rotation.y = steerInput * -0.32;
    }

    // Spin tires
    const tireSpin = p.speed * dt * 8.0;
    if (frontTireRef.current) frontTireRef.current.rotation.x += tireSpin;
    if (rearTireRef.current) rearTireRef.current.rotation.x += tireSpin;

    // Dynamic Rider Hang-off Pose
    if (riderRef.current) {
      riderRef.current.position.x = p.leanAngle * -0.22;
      riderRef.current.rotation.z = p.leanAngle * 0.15; // head turns into apex
    }
    if (legLRef.current && legRRef.current) {
      if (p.kickTimer > 0) {
        legRRef.current.rotation.z = 1.35; // Extended kick leg
        legRRef.current.position.x = 0.45;
      } else if (p.leanAngle < -0.15) {
        legLRef.current.rotation.z = -0.65; // Left knee-down dragging puck
        legLRef.current.position.x = -0.36;
        legRRef.current.rotation.z = 0;
        legRRef.current.position.x = 0.22;
      } else if (p.leanAngle > 0.15) {
        legRRef.current.rotation.z = 0.65; // Right knee-down dragging puck
        legRRef.current.position.x = 0.36;
        legLRef.current.rotation.z = 0;
        legLRef.current.position.x = -0.22;
      } else {
        legLRef.current.rotation.z = 0;
        legLRef.current.position.x = -0.22;
        legRRef.current.rotation.z = 0;
        legRRef.current.position.x = 0.22;
      }
    }
  });

  return (
    <group ref={bikeRootRef} name="PlayerBikeGroup">
      {/* ============================================================ */}
      {/* 1. CHASSIS: Twin-Spar Billet Aluminum Perimeter Frame        */}
      {/* ============================================================ */}
      {/* Main Twin Diagonal Spars */}
      <mesh position={[-0.22, 0.68, -0.05]} rotation={[0.42, 0, -0.1]} material={materials.chassisAlu} castShadow>
        <boxGeometry args={[0.07, 0.14, 0.95]} />
      </mesh>
      <mesh position={[0.22, 0.68, -0.05]} rotation={[0.42, 0, 0.1]} material={materials.chassisAlu} castShadow>
        <boxGeometry args={[0.07, 0.14, 0.95]} />
      </mesh>
      {/* Steering Head Tube */}
      <mesh position={[0, 0.82, -0.58]} rotation={[0.34, 0, 0]} material={materials.chassisAlu}>
        <cylinderGeometry args={[0.065, 0.075, 0.42, 10]} />
      </mesh>

      {/* ============================================================ */}
      {/* 2. ENGINE & DRIVETRAIN: 4-Cylinder Inline Superbike Motor     */}
      {/* ============================================================ */}
      {/* Engine Crankcase & Cylinder Block */}
      <mesh position={[0, 0.45, -0.02]} material={materials.darkMetal} castShadow>
        <boxGeometry args={[0.44, 0.38, 0.56]} />
      </mesh>
      {/* Right Bronze Clutch Cover */}
      <mesh position={[0.24, 0.42, 0.06]} rotation={[0, 0, Math.PI / 2]} material={materials.clutchBronze}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 14]} />
      </mesh>
      {/* Left Alternator Stator Cover */}
      <mesh position={[-0.24, 0.42, -0.08]} rotation={[0, 0, Math.PI / 2]} material={materials.darkMetal}>
        <cylinderGeometry args={[0.11, 0.11, 0.07, 12]} />
      </mesh>
      {/* 4-into-1 Stainless Exhaust Header Pipes */}
      <group position={[0, 0.36, -0.32]}>
        {[-0.14, -0.05, 0.05, 0.14].map((px, idx) => (
          <mesh key={idx} position={[px, 0, 0]} rotation={[0.7, 0, 0]} material={materials.chromeSteel}>
            <cylinderGeometry args={[0.022, 0.022, 0.35, 8]} />
          </mesh>
        ))}
      </group>
      {/* Upswept Titanium Akrapovič Exhaust Silencer with Carbon End-Cap */}
      <group position={[0.26, 0.52, 0.58]} rotation={[0.38, -0.08, 0]}>
        <mesh material={materials.titaniumBlue}>
          <cylinderGeometry args={[0.065, 0.08, 0.82, 10]} />
        </mesh>
        {/* Carbon Exhaust Outlet Tip */}
        <mesh position={[0, 0.43, 0]} material={materials.carbon}>
          <cylinderGeometry args={[0.05, 0.065, 0.08, 10]} />
        </mesh>
      </group>
      {/* Carbon Belly Pan Fairing */}
      <mesh position={[0, 0.28, -0.08]} material={materials.carbon}>
        <boxGeometry args={[0.42, 0.14, 0.75]} />
      </mesh>

      {/* ============================================================ */}
      {/* 3. BODYWORK & FAIRINGS: Sculpted Red/White Aerodynamics      */}
      {/* ============================================================ */}
      {/* Aerodynamic Front Nose Fairing */}
      <mesh position={[0, 0.88, -0.66]} rotation={[-Math.PI * 0.42, 0, 0]} material={materials.fairingRed} castShadow>
        <coneGeometry args={[0.36, 0.78, 6]} />
      </mesh>
      {/* Ram-Air Induction Center Intake Duct */}
      <mesh position={[0, 0.82, -0.88]} material={materials.darkMetal}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
      </mesh>
      {/* Angular Twin Projector LED Headlights */}
      <mesh position={[-0.14, 0.86, -0.92]} material={materials.headlight}>
        <boxGeometry args={[0.11, 0.05, 0.04]} />
      </mesh>
      <mesh position={[0.14, 0.86, -0.92]} material={materials.headlight}>
        <boxGeometry args={[0.11, 0.05, 0.04]} />
      </mesh>
      {/* Dual MotoGP Carbon Downforce Winglets (Left & Right) */}
      <mesh position={[-0.34, 0.84, -0.68]} rotation={[0.15, 0.2, -0.22]} material={materials.carbon}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
      </mesh>
      <mesh position={[0.34, 0.84, -0.68]} rotation={[0.15, -0.2, 0.22]} material={materials.carbon}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
      </mesh>
      {/* Aerodynamic Bubble Windscreen */}
      <mesh position={[0, 1.1, -0.68]} rotation={[-Math.PI * 0.28, 0, 0]} material={materials.windscreen}>
        <planeGeometry args={[0.34, 0.44]} />
      </mesh>
      {/* Sculpted Side Fairing Panels with White Racing Accents */}
      <mesh position={[-0.24, 0.66, -0.26]} rotation={[0, -0.06, 0]} material={materials.fairingRed}>
        <boxGeometry args={[0.05, 0.45, 0.72]} />
      </mesh>
      <mesh position={[0.24, 0.66, -0.26]} rotation={[0, 0.06, 0]} material={materials.fairingRed}>
        <boxGeometry args={[0.05, 0.45, 0.72]} />
      </mesh>
      <mesh position={[-0.25, 0.62, -0.15]} material={materials.fairingWhite}>
        <boxGeometry args={[0.055, 0.22, 0.45]} />
      </mesh>
      <mesh position={[0.25, 0.62, -0.15]} material={materials.fairingWhite}>
        <boxGeometry args={[0.055, 0.22, 0.45]} />
      </mesh>

      {/* Sculpted Fuel Tank with Knee Indents */}
      <mesh position={[0, 0.94, -0.18]} material={materials.fairingRed} castShadow>
        <boxGeometry args={[0.42, 0.34, 0.56]} />
      </mesh>
      {/* Black Racing Fuel Cap */}
      <mesh position={[0, 1.12, -0.24]} material={materials.darkMetal}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
      </mesh>
      {/* Alcantara Racing Seat */}
      <mesh position={[0, 0.88, 0.16]} material={materials.suitDark}>
        <boxGeometry args={[0.3, 0.08, 0.36]} />
      </mesh>
      {/* Streamlined Single-Seat Tail Cowl with Aero Tunnels */}
      <mesh position={[0, 0.92, 0.62]} rotation={[Math.PI * 0.44, 0, 0]} material={materials.fairingRed}>
        <coneGeometry args={[0.26, 0.8, 5]} />
      </mesh>
      {/* Red LED Taillight Strip */}
      <mesh position={[0, 0.96, 0.94]} material={materials.taillight}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
      </mesh>

      {/* ============================================================ */}
      {/* 4. STEERING, ÖHLINS FORKS & FRONT WHEEL ASSEMBLY             */}
      {/* ============================================================ */}
      <group ref={frontForkRef} position={[0, 0.62, -0.66]}>
        {/* Upper & Lower Billet Triple Clamps */}
        <mesh position={[0, 0.34, -0.04]} material={materials.darkMetal}>
          <boxGeometry args={[0.38, 0.04, 0.09]} />
        </mesh>
        <mesh position={[0, 0.16, -0.01]} material={materials.darkMetal}>
          <boxGeometry args={[0.38, 0.04, 0.09]} />
        </mesh>
        {/* Inverted Öhlins Gold Stanchions */}
        <mesh position={[-0.16, 0.05, 0]} rotation={[0.32, 0, 0]} material={materials.goldOhlins}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 10]} />
        </mesh>
        <mesh position={[0.16, 0.05, 0]} rotation={[0.32, 0, 0]} material={materials.goldOhlins}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 10]} />
        </mesh>
        {/* Chrome Sliders */}
        <mesh position={[-0.16, -0.16, -0.07]} rotation={[0.32, 0, 0]} material={materials.chromeSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 10]} />
        </mesh>
        <mesh position={[0.16, -0.16, -0.07]} rotation={[0.32, 0, 0]} material={materials.chromeSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 10]} />
        </mesh>

        {/* Clip-on Handlebars with Grips & Levers */}
        <mesh position={[0, 0.36, -0.06]} rotation={[0, 0, Math.PI / 2]} material={materials.darkMetal}>
          <cylinderGeometry args={[0.018, 0.018, 0.64, 8]} />
        </mesh>
        {/* Rubber Grips */}
        <mesh position={[-0.28, 0.36, -0.06]} rotation={[0, 0, Math.PI / 2]} material={materials.tires}>
          <cylinderGeometry args={[0.024, 0.024, 0.14, 8]} />
        </mesh>
        <mesh position={[0.28, 0.36, -0.06]} rotation={[0.0, 0, Math.PI / 2]} material={materials.tires}>
          <cylinderGeometry args={[0.024, 0.024, 0.14, 8]} />
        </mesh>
        {/* Digital Full-Color TFT Race Dash */}
        <mesh position={[0, 0.44, -0.04]} rotation={[-0.7, 0, 0]} material={materials.dashboard}>
          <boxGeometry args={[0.14, 0.08, 0.02]} />
        </mesh>

        {/* Aerodynamic Front Carbon Mudguard */}
        <mesh position={[0, -0.08, -0.16]} rotation={[0.32, 0, 0]} material={materials.carbon}>
          <cylinderGeometry args={[0.36, 0.36, 0.17, 12, 1, false, 0, Math.PI * 0.7]} />
        </mesh>

        {/* Dual Brembo Gold Brake Calipers */}
        <mesh position={[-0.12, -0.22, -0.1]} material={materials.caliperGold}>
          <boxGeometry args={[0.05, 0.1, 0.08]} />
        </mesh>
        <mesh position={[0.12, -0.22, -0.1]} material={materials.caliperGold}>
          <boxGeometry args={[0.05, 0.1, 0.08]} />
        </mesh>

        {/* Front Wheel: Slick Tire + Red Rim + Dual Discs */}
        <group position={[0, -0.24, -0.16]}>
          <mesh ref={frontTireRef} rotation={[0, 0, Math.PI / 2]} material={materials.tires} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.15, 18]} />
            {/* Red Multi-Spoke Rim */}
            <mesh material={materials.racingRim}>
              <cylinderGeometry args={[0.24, 0.24, 0.16, 12]} />
            </mesh>
          </mesh>
          {/* Dual Perforated Brake Discs */}
          <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeSteel}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 14]} />
          </mesh>
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeSteel}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 14]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 5. REAR SWINGARM, MONOSHOCK & REAR WHEEL ASSEMBLY            */}
      {/* ============================================================ */}
      {/* Aluminum Rear Swingarm */}
      <mesh position={[0, 0.38, 0.44]} material={materials.chassisAlu}>
        <boxGeometry args={[0.34, 0.11, 0.74]} />
      </mesh>
      {/* Rear Yellow Monoshock Coil Spring */}
      <mesh position={[0, 0.55, 0.24]} rotation={[0.4, 0, 0]} material={materials.springYellow}>
        <cylinderGeometry args={[0.045, 0.045, 0.26, 8]} />
      </mesh>
      {/* Gold Racing Drive Chain */}
      <mesh position={[-0.14, 0.38, 0.46]} material={materials.goldChain}>
        <boxGeometry args={[0.02, 0.04, 0.65]} />
      </mesh>

      {/* Rear Wheel: Wide Slick Tire + Rim + Brake Disc */}
      <group position={[0, 0.4, 0.8]}>
        <mesh ref={rearTireRef} rotation={[0, 0, Math.PI / 2]} material={materials.tires} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.24, 18]} />
          {/* Red Rim */}
          <mesh material={materials.racingRim}>
            <cylinderGeometry args={[0.24, 0.24, 0.25, 12]} />
          </mesh>
        </mesh>
        {/* Rear Brake Disc */}
        <mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeSteel}>
          <cylinderGeometry args={[0.18, 0.18, 0.015, 12]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 6. PRO RIDER IN ARTICULATED LEATHERS & RACING HELMET        */}
      {/* ============================================================ */}
      <group ref={riderRef} position={[0, 0.9, 0.12]}>
        {/* Torso in Aggressive Aero Tuck */}
        <mesh position={[0, 0.2, -0.16]} rotation={[0.56, 0, 0]} material={materials.suitRed} castShadow>
          <boxGeometry args={[0.38, 0.42, 0.58]} />
        </mesh>
        {/* Suit White Contrast Front Patch */}
        <mesh position={[0, 0.22, -0.32]} rotation={[0.56, 0, 0]} material={materials.suitWhite}>
          <boxGeometry args={[0.22, 0.28, 0.04]} />
        </mesh>
        {/* Aerodynamic Speed Hump on Back */}
        <mesh position={[0, 0.44, 0.06]} rotation={[Math.PI * 0.45, 0, 0]} material={materials.suitDark}>
          <coneGeometry args={[0.13, 0.38, 6]} />
        </mesh>

        {/* Full-Face Aerodynamic Racing Helmet */}
        <group position={[0, 0.48, -0.42]}>
          <mesh scale={[1, 1.15, 1.25]} material={materials.helmetShell} castShadow>
            <sphereGeometry args={[0.22, 14, 12]} />
          </mesh>
          {/* Team Red Helmet Stripe */}
          <mesh position={[0, 0.06, 0]} scale={[0.35, 1.16, 1.26]} material={materials.fairingRed}>
            <sphereGeometry args={[0.22, 10, 10]} />
          </mesh>
          {/* Iridescent Dark Mirror Visor */}
          <mesh position={[0, 0.02, -0.16]} material={materials.visorDark}>
            <boxGeometry args={[0.28, 0.1, 0.14]} />
          </mesh>
        </group>

        {/* Articulated Arms Gripping Clip-on Bars */}
        <mesh position={[-0.26, 0.22, -0.36]} rotation={[0.82, 0, -0.38]} material={materials.suitRed}>
          <cylinderGeometry args={[0.06, 0.055, 0.48, 8]} />
        </mesh>
        <mesh position={[0.26, 0.22, -0.36]} rotation={[0.82, 0, 0.38]} material={materials.suitRed}>
          <cylinderGeometry args={[0.06, 0.055, 0.48, 8]} />
        </mesh>
        {/* Carbon Knuckle Gloves */}
        <mesh position={[-0.28, 0.08, -0.56]} material={materials.suitDark}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
        </mesh>
        <mesh position={[0.28, 0.08, -0.56]} material={materials.suitDark}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
        </mesh>

        {/* Dynamic Hanging-Off Articulated Legs */}
        {/* Left Leg + Spark Knee Puck */}
        <group ref={legLRef} position={[-0.22, -0.04, 0.04]}>
          <mesh rotation={[-0.48, 0, 0]} material={materials.suitDark}>
            <boxGeometry args={[0.13, 0.32, 0.16]} />
          </mesh>
          {/* White Dragging Knee Slider Puck */}
          <mesh position={[-0.1, -0.08, 0.1]} material={materials.kneePuck}>
            <boxGeometry args={[0.07, 0.09, 0.07]} />
          </mesh>
          {/* Armored Racing Boot */}
          <mesh position={[0, -0.22, 0.16]} rotation={[0.3, 0, 0]} material={materials.darkMetal}>
            <boxGeometry args={[0.11, 0.14, 0.24]} />
          </mesh>
        </group>

        {/* Right Leg + Knee Puck */}
        <group ref={legRRef} position={[0.22, -0.04, 0.04]}>
          <mesh rotation={[-0.48, 0, 0]} material={materials.suitDark}>
            <boxGeometry args={[0.13, 0.32, 0.16]} />
          </mesh>
          {/* White Knee Slider Puck */}
          <mesh position={[0.1, -0.08, 0.1]} material={materials.kneePuck}>
            <boxGeometry args={[0.07, 0.09, 0.07]} />
          </mesh>
          {/* Armored Racing Boot */}
          <mesh position={[0, -0.22, 0.16]} rotation={[0.3, 0, 0]} material={materials.darkMetal}>
            <boxGeometry args={[0.11, 0.14, 0.24]} />
          </mesh>
        </group>
      </group>

      {/* Nitro Flame Jet FX */}
      <ExhaustFX active={nos && throttle} />
    </group>
  );
}
