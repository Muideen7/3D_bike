'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_SPLINE, CircuitMath, ROAD_WIDTH } from '@/physics/TrackSpline';

export function TrackMesh() {
  const { geometry, asphaltTexture, startChequeredTexture, gridBoxes } = useMemo(() => {
    const samples = CircuitMath.SAMPLES;
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const pt = TRACK_SPLINE.getPointAt(u);
      const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

      const left = pt.clone().addScaledVector(normal, -ROAD_WIDTH * 0.5);
      const right = pt.clone().addScaledVector(normal, ROAD_WIDTH * 0.5);

      positions.push(left.x, left.y + 0.04, left.z);
      positions.push(right.x, right.y + 0.04, right.z);

      const v = u * 75.0; // road texture repeats
      uvs.push(0, v, 1, v);

      if (i < samples) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    // 1. Procedural High-Grip Asphalt Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dark asphalt
    ctx.fillStyle = '#16191f';
    ctx.fillRect(0, 0, 512, 512);

    // Fine mineral aggregate grain
    for (let p = 0; p < 4500; p++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#242830' : '#0e1014';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // Heavy rubber groove along dual racing lines
    ctx.fillStyle = 'rgba(8, 10, 13, 0.55)';
    ctx.fillRect(150, 0, 80, 512);
    ctx.fillRect(285, 0, 80, 512);

    // Lateral micro-grooves
    ctx.fillStyle = 'rgba(25, 28, 35, 0.35)';
    for (let y = 0; y < 512; y += 8) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Outer white boundary lines (thick racing regulation lines)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(12, 0, 10, 512);
    ctx.fillRect(490, 0, 10, 512);

    // Dashed center line
    ctx.fillRect(251, 40, 10, 140);
    ctx.fillRect(251, 300, 10, 140);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 40);

    // 2. Start/Finish Chequered Line Texture
    const chkCanvas = document.createElement('canvas');
    chkCanvas.width = 512;
    chkCanvas.height = 128;
    const chkCtx = chkCanvas.getContext('2d')!;
    const sq = 32;
    for (let x = 0; x < 512; x += sq) {
      for (let y = 0; y < 128; y += sq) {
        chkCtx.fillStyle = (Math.floor(x / sq) + Math.floor(y / sq)) % 2 === 0 ? '#ffffff' : '#0f172a';
        chkCtx.fillRect(x, y, sq, sq);
      }
    }
    const chkTex = new THREE.CanvasTexture(chkCanvas);

    // 3. Starting Grid Slot Boxes along pit straight
    const gBoxes: { position: [number, number, number]; rotation: [number, number, number]; num: number }[] = [];
    const gridPositions = [
      { u: 0.003, lane: -2.4, num: 1 }, // Pole Position
      { u: 0.009, lane: 2.4,  num: 2 },
      { u: 0.015, lane: -2.4, num: 3 },
      { u: 0.021, lane: 2.4,  num: 4 },
      { u: 0.027, lane: -2.4, num: 5 },
      { u: 0.033, lane: 2.4,  num: 6 },
    ];

    gridPositions.forEach((gp) => {
      const frame = CircuitMath.getVehicleFrame(gp.u, gp.lane);
      const euler = new THREE.Euler().setFromQuaternion(frame.quaternion);
      gBoxes.push({
        position: [frame.position.x, frame.position.y + 0.01, frame.position.z],
        rotation: [euler.x, euler.y, euler.z],
        num: gp.num,
      });
    });

    return {
      geometry: geom,
      asphaltTexture: tex,
      startChequeredTexture: chkTex,
      gridBoxes: gBoxes,
    };
  }, []);

  const finishFrame = useMemo(() => {
    const frame = CircuitMath.getVehicleFrame(0.0005, 0);
    const euler = new THREE.Euler().setFromQuaternion(frame.quaternion);
    return {
      position: [frame.position.x, frame.position.y + 0.02, frame.position.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
    };
  }, []);

  return (
    <group>
      {/* Main Extruded Asphalt Circuit */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={asphaltTexture} roughness={0.88} metalness={0.08} />
      </mesh>

      {/* Start / Finish Chequered Stripe across track */}
      <mesh position={finishFrame.position} rotation={finishFrame.rotation} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH - 0.6, 2.8]} />
        <meshBasicMaterial map={startChequeredTexture} />
      </mesh>

      {/* Starting Grid Boxes */}
      {gridBoxes.map((gb, i) => (
        <group key={`grid-${i}`} position={gb.position} rotation={gb.rotation}>
          {/* White Front Wheel Stop Bar */}
          <mesh position={[0, 0.01, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.8, 0.3]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Box Outline */}
          <mesh position={[-1.35, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 3.0]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[1.35, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 3.0]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Yellow Grid Number Badge */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 16]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
