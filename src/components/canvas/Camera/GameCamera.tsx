'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useControlStore } from '@/store/useControlStore';

export function GameCamera() {
  const { camera, scene } = useThree();
  const cameraMode = useControlStore((s) => s.cameraMode);

  const playerRootRef = useRef<THREE.Object3D | null>(null);
  const isFirstFrame = useRef(true);
  const prevMode = useRef(cameraMode);
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Find and cache the player bike root in the scene graph
    if (!playerRootRef.current || !playerRootRef.current.parent) {
      playerRootRef.current = scene.getObjectByName('PlayerBikeGroup') || null;
    }

    const playerRoot = playerRootRef.current;
    if (!playerRoot) return;

    const dt = Math.min(delta, 0.1);
    const bikePos = playerRoot.position;
    const bikeQuat = playerRoot.quaternion;

    // Vehicle orientation vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(bikeQuat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(bikeQuat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(bikeQuat);

    let targetPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();
    let lerpSpeed = 14;

    if (cameraMode === 'CHASE') {
      // Dynamic 3rd-person chase camera (following behind & slightly above bike)
      targetPos = bikePos
        .clone()
        .addScaledVector(forward, -6.2)
        .add(new THREE.Vector3(0, 3.0, 0));

      lookTarget = bikePos
        .clone()
        .add(new THREE.Vector3(0, 1.3, 0))
        .addScaledVector(forward, 4.5);
      lerpSpeed = 14;
    } else if (cameraMode === 'COCKPIT') {
      // Handlebar / Helmet First-Person View
      targetPos = bikePos
        .clone()
        .add(new THREE.Vector3(0, 1.35, 0))
        .addScaledVector(forward, -0.15);

      lookTarget = targetPos
        .clone()
        .addScaledVector(forward, 16.0);
      lerpSpeed = 30; // Snappier for cockpit
    } else if (cameraMode === 'LOW_ANGLE') {
      // Low-Angle Apex Action Cam
      targetPos = bikePos
        .clone()
        .addScaledVector(right, 3.2)
        .addScaledVector(forward, 1.0)
        .add(new THREE.Vector3(0, 0.9, 0));

      lookTarget = bikePos
        .clone()
        .add(new THREE.Vector3(0, 1.1, 0));
      lerpSpeed = 10;
    } else {
      // Far Chase / Broadcast Helicopter Cam
      targetPos = bikePos
        .clone()
        .addScaledVector(forward, -11.0)
        .add(new THREE.Vector3(0, 6.0, 0));

      lookTarget = bikePos
        .clone()
        .add(new THREE.Vector3(0, 1.2, 0))
        .addScaledVector(forward, 2.0);
      lerpSpeed = 8;
    }

    const shouldSnap = isFirstFrame.current || prevMode.current !== cameraMode;

    if (shouldSnap) {
      camera.position.copy(targetPos);
      currentLookAt.current.copy(lookTarget);
      camera.lookAt(lookTarget);
      isFirstFrame.current = false;
      prevMode.current = cameraMode;
    } else {
      const posLerp = 1 - Math.exp(-lerpSpeed * dt);
      camera.position.lerp(targetPos, posLerp);
      currentLookAt.current.lerp(lookTarget, posLerp);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}
