'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_SPLINE, CircuitMath, ROAD_WIDTH } from '@/physics/TrackSpline';

export function Scenery() {
  const {
    billboards,
    trees,
    distantMountains,
    gravelTraps,
    tireWalls,
    brakeMarkers,
    grandstand,
  } = useMemo(() => {
    const samples = CircuitMath.SAMPLES;
    const trackPoints: THREE.Vector3[] = [];
    for (let i = 0; i < samples; i++) {
      trackPoints.push(TRACK_SPLINE.getPointAt(i / samples));
    }

    // Helper: Distance to nearest point on track
    function distToTrack(x: number, z: number): number {
      let minD = Infinity;
      for (let i = 0; i < samples; i += 4) {
        const p = trackPoints[i];
        const dx = p.x - x;
        const dz = p.z - z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < minD) minD = d;
      }
      return minD;
    }

    // 1. Distant Mountain Ring (Strictly pushed far beyond track boundary)
    // Track center is around (80, 0, -70), track max radius is ~330.
    // Mountains are generated at distance 720..950, guaranteed > 220 units from track!
    const trackCenterX = 80;
    const trackCenterZ = -70;
    const mtns: {
      position: [number, number, number];
      baseRadius: number;
      height: number;
      rotation: number;
    }[] = [];

    const numMountains = 28;
    for (let i = 0; i < numMountains; i++) {
      const angle = (i / numMountains) * Math.PI * 2 + (i % 2) * 0.05;
      const dist = 760 + Math.sin(angle * 3) * 110 + (i % 3) * 40;
      let mx = trackCenterX + Math.cos(angle) * dist;
      let mz = trackCenterZ + Math.sin(angle) * dist;

      // Ensure minimum safe distance of 220 units from any point on the track
      while (distToTrack(mx, mz) < 220) {
        mx += Math.cos(angle) * 50;
        mz += Math.sin(angle) * 50;
      }

      const height = 130 + Math.sin(i * 1.8) * 45 + (i % 4) * 20;
      const baseRadius = 140 + Math.cos(i * 2.2) * 35;
      mtns.push({
        position: [mx, height * 0.46, mz],
        baseRadius,
        height,
        rotation: (i * 0.4) % Math.PI,
      });
    }

    // 2. Sponsor Billboards along track curves
    const sponsorNames = [
      'SUPERBIKE GP 3D',
      'BREMBO RACING',
      'PIRELLI DIABLO',
      'MOTUL 300V',
      'ALPINESTARS',
      'AKRAPOVIČ',
      'ÖHLINS RACING',
      'DAINESE D-AIR',
    ];
    const bBoards: {
      position: [number, number, number];
      rotation: [number, number, number];
      texture: THREE.CanvasTexture;
    }[] = [];

    sponsorNames.forEach((name, i) => {
      const u = (i * 0.12 + 0.04) % 1.0;
      const pt = TRACK_SPLINE.getPointAt(u);
      const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

      const signSide = i % 2 === 0 ? 1 : -1;
      const signPos = pt.clone().addScaledVector(normal, signSide * (ROAD_WIDTH * 0.5 + 4.8));
      signPos.y += 2.4;

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Dynamic sponsor banner graphics
      const colors = [
        ['#dc2626', '#991b1b'],
        ['#0284c7', '#0369a1'],
        ['#ea580c', '#c2410c'],
        ['#16a34a', '#15803d'],
      ];
      const [c1, c2] = colors[i % colors.length];
      const grad = ctx.createLinearGradient(0, 0, 512, 128);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 128);

      // Border accents
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 8);
      ctx.fillRect(0, 120, 512, 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal.clone().multiplyScalar(-signSide)
      );
      const euler = new THREE.Euler().setFromQuaternion(quat);

      bBoards.push({
        position: [signPos.x, signPos.y, signPos.z],
        rotation: [euler.x, euler.y, euler.z],
        texture: tex,
      });
    });

    // 3. Sand / Gravel Runoff Traps at High-G Curves (Turns 1, 2, Hairpin, Chicane)
    const trapZones = [
      { startU: 0.12, endU: 0.22, side: -1, width: 14 }, // Turn 1 & 2 Sweeper
      { startU: 0.23, endU: 0.29, side: 1, width: 12 },  // Turn 3
      { startU: 0.40, endU: 0.47, side: -1, width: 12 }, // Chicane
      { startU: 0.59, endU: 0.70, side: 1, width: 16 },  // Hairpin
      { startU: 0.75, endU: 0.85, side: -1, width: 12 }, // S-Curves
    ];

    const gTraps: THREE.BufferGeometry[] = [];
    trapZones.forEach((tz) => {
      const stepCount = 28;
      const pos: number[] = [];
      const idx: number[] = [];

      for (let s = 0; s <= stepCount; s++) {
        const u = tz.startU + (s / stepCount) * (tz.endU - tz.startU);
        const pt = TRACK_SPLINE.getPointAt(u);
        const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

        const innerOffset = tz.side * (ROAD_WIDTH * 0.5 + 1.8);
        const outerOffset = tz.side * (ROAD_WIDTH * 0.5 + 1.8 + tz.width);

        const innerPt = pt.clone().addScaledVector(normal, innerOffset);
        const outerPt = pt.clone().addScaledVector(normal, outerOffset);

        pos.push(innerPt.x, innerPt.y + 0.04, innerPt.z);
        pos.push(outerPt.x, outerPt.y + 0.02, outerPt.z);

        if (s < stepCount) {
          const r1 = s * 2;
          const r2 = (s + 1) * 2;
          idx.push(r1, r1 + 1, r2);
          idx.push(r1 + 1, r2 + 1, r2);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geom.setIndex(idx);
      geom.computeVertexNormals();
      gTraps.push(geom);
    });

    // 4. 3D Tire Wall Barriers (Red & White stacked racing tires behind gravel traps)
    const tWalls: { position: [number, number, number]; rotationY: number; isRed: boolean }[] = [];
    trapZones.forEach((tz) => {
      const wallCount = 14;
      for (let w = 0; w < wallCount; w++) {
        const u = tz.startU + (w / wallCount) * (tz.endU - tz.startU);
        const pt = TRACK_SPLINE.getPointAt(u);
        const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

        const wallOffset = tz.side * (ROAD_WIDTH * 0.5 + 1.8 + tz.width + 1.2);
        const wallPos = pt.clone().addScaledVector(normal, wallOffset);
        const rotY = Math.atan2(tangent.x, tangent.z);

        tWalls.push({
          position: [wallPos.x, wallPos.y + 0.5, wallPos.z],
          rotationY: rotY,
          isRed: w % 2 === 0,
        });
      }
    });

    // 5. Brake Distance Marker Boards (150m, 100m, 50m before Turn 1 and Hairpin)
    const bMarkers: { position: [number, number, number]; rotationY: number; text: string }[] = [];
    const markerZones = [
      { uBase: 0.10, dists: ['150', '100', '50'] },
      { uBase: 0.58, dists: ['150', '100', '50'] },
    ];
    markerZones.forEach((mz) => {
      mz.dists.forEach((dStr, idx) => {
        const u = mz.uBase - (3 - idx) * 0.012;
        const pt = TRACK_SPLINE.getPointAt((u + 1.0) % 1.0);
        const tangent = TRACK_SPLINE.getTangentAt((u + 1.0) % 1.0).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

        const boardPos = pt.clone().addScaledVector(normal, -(ROAD_WIDTH * 0.5 + 2.5));
        const rotY = Math.atan2(-normal.x, -normal.z);

        bMarkers.push({
          position: [boardPos.x, boardPos.y + 1.2, boardPos.z],
          rotationY: rotY,
          text: dStr,
        });
      });
    });

    // 6. Grandstand Structure along the Start/Finish Pit Straight
    const pitStraightMid = TRACK_SPLINE.getPointAt(0.04);
    const pitTangent = TRACK_SPLINE.getTangentAt(0.04).normalize();
    const pitNormal = new THREE.Vector3().crossVectors(pitTangent, new THREE.Vector3(0, 1, 0)).normalize();
    const grandstandPos = pitStraightMid.clone().addScaledVector(pitNormal, ROAD_WIDTH * 0.5 + 14.0);
    const grandstandRotY = Math.atan2(-pitNormal.x, -pitNormal.z);

    // 7. Trackside Trees placed strictly at safe distance (> 24 units from track)
    const treeList: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < samples; i += 10) {
      const u = i / samples;
      const pt = TRACK_SPLINE.getPointAt(u);
      const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

      [-1, 1].forEach((side) => {
        const offset = (ROAD_WIDTH * 0.5 + 24.0 + Math.sin(i * 3.7) * 12.0) * side;
        const pos = pt.clone().addScaledVector(normal, offset);
        if (distToTrack(pos.x, pos.z) > 18) {
          treeList.push({
            position: [pos.x, pos.y, pos.z],
            scale: 0.9 + Math.abs(Math.sin(i * 1.5)) * 0.6,
          });
        }
      });
    }

    return {
      billboards: bBoards,
      trees: treeList,
      distantMountains: mtns,
      gravelTraps: gTraps,
      tireWalls: tWalls,
      brakeMarkers: bMarkers,
      grandstand: {
        position: [grandstandPos.x, grandstandPos.y, grandstandPos.z] as [number, number, number],
        rotationY: grandstandRotY,
      },
    };
  }, []);

  return (
    <group>
      {/* Expansive Grass Runoff Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[80, -0.06, -70]} receiveShadow>
        <planeGeometry args={[2200, 2200]} />
        <meshLambertMaterial color="#2d521e" />
      </mesh>

      {/* Realistic Distant Mountain Ranges (Zero overlap with circuit) */}
      {distantMountains.map((m, i) => (
        <group key={`mtn-${i}`} position={m.position} rotation={[0, m.rotation, 0]}>
          {/* Rocky Lower Slope */}
          <mesh position={[0, -m.height * 0.12, 0]}>
            <coneGeometry args={[m.baseRadius, m.height, 6]} />
            <meshLambertMaterial color="#475569" flatShading />
          </mesh>
          {/* Snowcap Peak */}
          <mesh position={[0, m.height * 0.28, 0]}>
            <coneGeometry args={[m.baseRadius * 0.42, m.height * 0.45, 6]} />
            <meshLambertMaterial color="#f1f5f9" flatShading />
          </mesh>
        </group>
      ))}

      {/* Sand / Gravel Runoff Traps */}
      {gravelTraps.map((geom, i) => (
        <mesh key={`gravel-${i}`} geometry={geom} receiveShadow>
          <meshStandardMaterial color="#c89650" roughness={0.96} />
        </mesh>
      ))}

      {/* 3D Tire Wall Barriers */}
      {tireWalls.map((tw, i) => (
        <group key={`tire-${i}`} position={tw.position} rotation={[0, tw.rotationY, 0]}>
          {/* Lower tire layer */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.45, 10]} />
            <meshLambertMaterial color={tw.isRed ? '#dc2626' : '#f8fafc'} />
          </mesh>
          {/* Upper tire layer */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.45, 10]} />
            <meshLambertMaterial color={tw.isRed ? '#f8fafc' : '#dc2626'} />
          </mesh>
        </group>
      ))}

      {/* Brake Distance Marker Boards */}
      {brakeMarkers.map((bm, i) => (
        <group key={`bm-${i}`} position={bm.position} rotation={[0, bm.rotationY, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.4, 0.9, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      ))}

      {/* Grandstand Stadium Structure */}
      <group position={grandstand.position} rotation={[0, grandstand.rotationY, 0]}>
        {/* Tiered Bleachers */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[55, 7, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* Red & Yellow Stadium Seats */}
        <mesh position={[0, 5.0, -1]}>
          <boxGeometry args={[52, 2.5, 9]} />
          <meshStandardMaterial color="#e11d48" roughness={0.8} />
        </mesh>
        {/* Canopy Roof */}
        <mesh position={[0, 10.5, 2]} rotation={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[58, 0.6, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        {/* Canopy Support Pillars */}
        {[-24, -8, 8, 24].map((px, idx) => (
          <mesh key={idx} position={[px, 5.2, 7.5]}>
            <cylinderGeometry args={[0.3, 0.3, 11, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Sponsor Billboards */}
      {billboards.map((b, i) => (
        <group key={`bb-${i}`} position={b.position} rotation={b.rotation}>
          <mesh>
            <planeGeometry args={[12, 3.0]} />
            <meshBasicMaterial map={b.texture} />
          </mesh>
          <mesh position={[-4.5, -1.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 3.6, 6]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[4.5, -1.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 3.6, 6]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}

      {/* Low-Poly Conifer & Oak Trees */}
      {trees.map((t, i) => (
        <group key={`tree-${i}`} position={t.position} scale={[t.scale, t.scale, t.scale]}>
          {/* Trunk */}
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 3.6, 5]} />
            <meshLambertMaterial color="#3e2718" />
          </mesh>
          {/* Lower Foliage */}
          <mesh position={[0, 4.5, 0]}>
            <coneGeometry args={[2.8, 4.5, 6]} />
            <meshLambertMaterial color="#1b431c" flatShading />
          </mesh>
          {/* Upper Foliage */}
          <mesh position={[0, 6.8, 0]}>
            <coneGeometry args={[2.0, 3.8, 6]} />
            <meshLambertMaterial color="#235c24" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
