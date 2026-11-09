/**
 * Web Audio API Procedural Superbike Sound Synthesizer
 * 100% self-contained, zero external asset dependencies, low-latency
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private screechGain: GainNode | null = null;
  private nosGain: GainNode | null = null;
  private windGain: GainNode | null = null;

  private _enabled: boolean = true;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master Gain for instant, reliable Mute/Unmute
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._enabled ? 1.0 : 0.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Engine Oscillator Chain (4-Cylinder Superbike Roar)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineOsc1.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.engineOsc2.frequency.setValueAtTime(32.5, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.8, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();

      // 2. Procedural White Noise Generator (Screech, Wind, NOS)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Tire Screech Chain
      const screechSource = this.ctx.createBufferSource();
      screechSource.buffer = noiseBuffer;
      screechSource.loop = true;

      const screechFilter = this.ctx.createBiquadFilter();
      screechFilter.type = 'bandpass';
      screechFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
      screechFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      screechSource.connect(screechFilter);
      screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.masterGain);
      screechSource.start();

      // Wind Rush Chain
      const windSource = this.ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      windSource.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      windSource.start();

      // NOS Turbo Hiss Chain
      const nosSource = this.ctx.createBufferSource();
      nosSource.buffer = noiseBuffer;
      nosSource.loop = true;

      const nosFilter = this.ctx.createBiquadFilter();
      nosFilter.type = 'bandpass';
      nosFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);
      nosFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.nosGain = this.ctx.createGain();
      this.nosGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      nosSource.connect(nosFilter);
      nosFilter.connect(this.nosGain);
      this.nosGain.connect(this.masterGain);
      nosSource.start();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio synthesis init warning:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(enabled ? 1.0 : 0.0, now + 0.04);
    }
  }

  public update(rpmPercent: number, speedKmh: number, isBraking: boolean, isNosActive: boolean): void {
    if (!this.initialized || !this.ctx || !this.engineOsc1 || !this.engineGain || !this.engineFilter) return;

    const now = this.ctx.currentTime;

    // Engine Pitch and Filter modulation
    const baseFreq = 55 + rpmPercent * 280; // 55Hz (idle) to 335Hz (redline)
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    if (this.engineOsc2) {
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    }
    this.engineFilter.frequency.setTargetAtTime(320 + rpmPercent * 1900, now, 0.04);
    this.engineGain.gain.setTargetAtTime(0.18 + rpmPercent * 0.12, now, 0.04);

    // Tire Screech on heavy braking from speed
    if (this.screechGain) {
      const screechTarget = isBraking && speedKmh > 35 ? 0.22 : 0.0;
      this.screechGain.gain.setTargetAtTime(screechTarget, now, 0.06);
    }

    // Wind Rush at high velocity
    if (this.windGain) {
      const windTarget = Math.max(0, (speedKmh - 90) / 200) * 0.18;
      this.windGain.gain.setTargetAtTime(windTarget, now, 0.08);
    }

    // NOS Jet Burn
    if (this.nosGain) {
      const nosTarget = isNosActive ? 0.28 : 0.0;
      this.nosGain.gain.setTargetAtTime(nosTarget, now, 0.05);
    }
  }

  public playGearShift(): void {
    if (!this.initialized || !this.ctx || !this.masterGain || !this._enabled) return;
    try {
      const now = this.ctx.currentTime;
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(150, now);
      popOsc.frequency.exponentialRampToValueAtTime(35, now + 0.07);
      popGain.gain.setValueAtTime(0.24, now);
      popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      popOsc.connect(popGain);
      popGain.connect(this.masterGain);
      popOsc.start(now);
      popOsc.stop(now + 0.09);
    } catch (e) {}
  }

  public playImpact(): void {
    if (!this.initialized || !this.ctx || !this.masterGain || !this._enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(15, now + 0.16);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  public playBeep(isHigh: boolean = false): void {
    if (!this.initialized || !this.ctx || !this.masterGain || !this._enabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHigh ? 880 : 440, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
