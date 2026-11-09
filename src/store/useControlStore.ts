import { create } from 'zustand';
import { ControlState, CameraMode } from '../types/controls.types';

interface ControlStoreState extends ControlState {
  cameraMode: CameraMode;
  setInput: (key: keyof ControlState, value: boolean) => void;
  toggleAeroTuck: () => void;
  cycleCamera: () => void;
  resetInputs: () => void;
}

const CAMERA_MODES: CameraMode[] = ['CHASE', 'COCKPIT', 'LOW_ANGLE', 'FAR'];

export const useControlStore = create<ControlStoreState>((set) => ({
  throttle: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
  nos: false,
  aeroTuck: false,
  kick: false,
  cameraMode: 'CHASE',

  setInput: (key, value) => set({ [key]: value }),

  toggleAeroTuck: () => set((state) => ({ aeroTuck: !state.aeroTuck })),

  cycleCamera: () =>
    set((state) => {
      const currentIndex = CAMERA_MODES.indexOf(state.cameraMode);
      const nextIndex = (currentIndex + 1) % CAMERA_MODES.length;
      return { cameraMode: CAMERA_MODES[nextIndex] };
    }),

  resetInputs: () =>
    set({
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      nos: false,
      kick: false,
    }),
}));
