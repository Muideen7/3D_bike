import { create } from 'zustand';
import { QualityTier } from '../types/controls.types';

interface SettingsState {
  soundEnabled: boolean;
  quality: QualityTier;
  toastMessage: string | null;
  toggleSound: () => void;
  setQuality: (quality: QualityTier) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  quality: 'medium',
  toastMessage: null,

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setQuality: (quality) => set({ quality }),

  showToast: (msg) => {
    set({ toastMessage: msg });
  },

  clearToast: () => set({ toastMessage: null }),
}));
