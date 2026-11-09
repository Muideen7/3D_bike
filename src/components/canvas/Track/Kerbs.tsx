'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_SPLINE, CircuitMath, ROAD_WIDTH } from '@/physics/TrackSpline';

export function Kerbs() {
  const { leftKerbGeom, rightKerbGeom } = useMemo(() => {
    const samples = CircuitMath.SAMPLES;

    function buildKerb(isRight: boolean) {
      const geom = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const pt = TRACK_SPLINE.getPointAt(u);
        const tangent = TRACK_SPLINE.getTangentAt(u).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();

        const sideSign = isRight ? 1 : -1;
        const inner = pt.clone().addScaledVector(normal, sideSign * (ROAD_WIDTH * 0.5));
        const outer = pt.clone().addScaledVector(normal, sideSign * (ROAD_WIDTH * 0.5 + 1.8));

        // 3D elevated chamfered curb profile
        positions.push(inner.x, inner.y + 0.06, inner.z);
        positions.push(outer.x, outer.y + 0.16, outer.z);

        // Alternating FIA red and white curb pattern
        const isRed = Math.floor(i / 2) % 2 === 0;
        const r = isRed ? 0.92 : 0.96;
        const g = isRed ? 0.14 : 0.96;
        const b = isRed ? 0.16 : 0.96;

        colors.push(r, g, b, r, g, b);

        if (i < samples) {
          const row1 = i * 2;
          const row2 = (i + 1) * 2;
          indices.push(row1, row1 + 1, row2);
          indices.push(row1 + 1, row2 + 1, row2);
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    }

    return {
      leftKerbGeom: buildKerb(false),
      rightKerbGeom: buildKerb(true)
    };
  }, []);

  return (
    <group>
      <mesh geometry={leftKerbGeom} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh geometry={rightKerbGeom} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
    </group>
  );
}
