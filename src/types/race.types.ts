export type GameState = 'START' | 'COUNTDOWN' | 'RACING' | 'PAUSED' | 'FINISH';

export interface RacerTelemetry {
  id: string;
  name: string;
  isPlayer: boolean;
  u: number;            // 0..1 progression along spline
  laneOffset: number;   // lateral distance from center in meters
  speed: number;        // in m/s
  speedKmh: number;
  gear: number;
  rpm: number;          // 0..1
  leanAngle: number;    // roll angle in radians
  lap: number;
  nosLevel: number;     // 0..100
  kickTimer: number;
  engineBoost: number;
  rank: number;
}

export interface AIRacerSpec {
  id: string;
  name: string;
  bikeColor: number;
  riderColor: number;
  speedFactor: number;
  preferredLane: number;
}
