import { create } from 'zustand';
import { GameState, RacerTelemetry } from '../types/race.types';

interface RaceStoreState {
  gameState: GameState;
  countdown: number;
  lap: number;
  totalLaps: number;
  rank: number;
  totalRacers: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  nosLevel: number;
  raceTime: number;
  bestLapTime: number;
  totalTime: number;

  setGameState: (state: GameState) => void;
  setCountdown: (count: number) => void;
  updateTelemetry: (data: Partial<RacerTelemetry>) => void;
  setLap: (lap: number) => void;
  setRank: (rank: number) => void;
  setRaceTime: (time: number) => void;
  finishRace: (bestLap: number, total: number) => void;
  resetRace: () => void;
}

export const useRaceStore = create<RaceStoreState>((set) => ({
  gameState: 'START',
  countdown: 3,
  lap: 1,
  totalLaps: 2,
  rank: 1,
  totalRacers: 6,
  speedKmh: 0,
  rpm: 0.15,
  gear: 1,
  nosLevel: 100,
  raceTime: 0,
  bestLapTime: Infinity,
  totalTime: 0,

  setGameState: (state) => set({ gameState: state }),
  setCountdown: (count) => set({ countdown: count }),
  updateTelemetry: (data) =>
    set((state) => ({
      speedKmh: data.speedKmh !== undefined ? data.speedKmh : state.speedKmh,
      rpm: data.rpm !== undefined ? data.rpm : state.rpm,
      gear: data.gear !== undefined ? data.gear : state.gear,
      nosLevel: data.nosLevel !== undefined ? data.nosLevel : state.nosLevel,
      rank: data.rank !== undefined ? data.rank : state.rank,
    })),
  setLap: (lap) => set({ lap }),
  setRank: (rank) => set({ rank }),
  setRaceTime: (time) => set({ raceTime: time }),
  finishRace: (bestLap, total) =>
    set({
      gameState: 'FINISH',
      bestLapTime: bestLap,
      totalTime: total,
    }),
  resetRace: () =>
    set({
      gameState: 'START',
      countdown: 3,
      lap: 1,
      speedKmh: 0,
      rpm: 0.15,
      gear: 1,
      nosLevel: 100,
      raceTime: 0,
    }),
}));
