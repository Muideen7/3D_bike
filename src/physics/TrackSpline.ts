import * as THREE from 'three';

// Professional Grand Prix Circuit Spline Points with elevation
export const CIRCUIT_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),         // Start/Finish Gantry
  new THREE.Vector3(0, 0, -220),      // Fast Pit Straight
  new THREE.Vector3(45, 0.5, -320),   // Turn 1 Sweeper Right
  new THREE.Vector3(130, 2.0, -370),  // Turn 2
  new THREE.Vector3(210, 2.5, -330),  // Turn 3
  new THREE.Vector3(225, 1.5, -210),  // Downhill short straight
  new THREE.Vector3(180, 0.5, -110),  // Chicane Entry Left
  new THREE.Vector3(230, 0.5, -30),   // Chicane Exit Right
  new THREE.Vector3(260, 3.5, 90),    // Uphill Sweeper
  new THREE.Vector3(210, 4.0, 200),   // Hairpin Entry
  new THREE.Vector3(130, 1.5, 225),   // Hairpin Apex (180 deg)
  new THREE.Vector3(50, 0.0, 175),    // Hairpin Exit
  new THREE.Vector3(-45, 0.0, 135),   // S-Curve 1
  new THREE.Vector3(-95, 0.0, 55),    // S-Curve 2
  new THREE.Vector3(-80, 0.0, -45),   // Final Corner Entry
  new THREE.Vector3(-40, 0.0, -85),   // Final Corner Apex onto Straight
];

export const ROAD_WIDTH = 14.0;
export const TRACK_SPLINE = new THREE.CatmullRomCurve3(CIRCUIT_POINTS, true, 'centripetal');
export const TRACK_LENGTH = TRACK_SPLINE.getLength();

export interface TrackFrame {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  quaternion: THREE.Quaternion;
  banking: number;
}

export class CircuitMath {
  public static readonly SAMPLES = 400;
  private static frenetFrames = TRACK_SPLINE.computeFrenetFrames(CircuitMath.SAMPLES, true);

  /**
   * Evaluates the precise 3D position and orientation for a vehicle at parameter `u` (0..1)
   * with lateral `laneOffset` (negative = left side of road, positive = right side of road).
   */
  public static getVehicleFrame(u: number, laneOffset: number): TrackFrame {
    const clampedU = ((u % 1.0) + 1.0) % 1.0;
    const centerPt = TRACK_SPLINE.getPointAt(clampedU);
    const tangent = TRACK_SPLINE.getTangentAt(clampedU).normalize();

    // Reliable horizontal normal vector pointing to the RIGHT of vehicle heading
    const worldUp = new THREE.Vector3(0, 1, 0);
    const rightNormal = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
    const surfaceUp = new THREE.Vector3().crossVectors(rightNormal, tangent).normalize();

    // Banking camber on curves
    const sampleIndex = Math.floor(clampedU * CircuitMath.SAMPLES) % CircuitMath.SAMPLES;
    const nextSampleIndex = (sampleIndex + 1) % CircuitMath.SAMPLES;
    const tan1 = CircuitMath.frenetFrames.tangents[sampleIndex];
    const tan2 = CircuitMath.frenetFrames.tangents[nextSampleIndex];
    const curvature = tan1.clone().cross(tan2).y * 12.0;
    const banking = THREE.MathUtils.clamp(curvature, -0.22, 0.22);

    // Lateral displacement along rightNormal
    // positive laneOffset => moved to right side of track
    // negative laneOffset => moved to left side of track
    const vehiclePos = centerPt.clone().addScaledVector(rightNormal, laneOffset);
    vehiclePos.y += 0.08; // slightly above road surface to prevent z-fighting

    // Orientation along tangent with banking roll
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);
    const bankingQuat = new THREE.Quaternion().setFromAxisAngle(tangent, banking);
    quat.premultiply(bankingQuat);

    return {
      position: vehiclePos,
      tangent,
      normal: rightNormal,
      binormal: surfaceUp,
      quaternion: quat,
      banking
    };
  }

  /**
   * Clamp lane offset strictly to track asphalt boundaries
   */
  public static clampLane(laneOffset: number): number {
    const maxHalfWidth = (ROAD_WIDTH * 0.5) - 1.2;
    return THREE.MathUtils.clamp(laneOffset, -maxHalfWidth, maxHalfWidth);
  }
}
