export interface ControlState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  nos: boolean;
  aeroTuck: boolean;
  kick: boolean;
}

export type CameraMode = 'CHASE' | 'COCKPIT' | 'LOW_ANGLE' | 'FAR';

export type QualityTier = 'low' | 'medium' | 'high';
