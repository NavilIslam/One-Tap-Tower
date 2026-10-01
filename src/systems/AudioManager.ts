import { SaveManager } from './SaveManager.ts';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private isMusicPlaying = false;
  private musicIntervalId: number | null = null;
  private step = 0;
  private intensity: 'normal' | 'high' | 'insane' = 'normal';
  private bpm = 126;

  private coinPitches: number[] = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50 // C6
  ];

  private constructor() {
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initContext(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.updateVolumes();
    } catch (e) {
      console.warn('[AudioManager] Web Audio not supported:', e);
    }
  }

  public updateVolumes(): void {
    const settings = SaveManager.getInstance().getData().settings;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(settings.soundEnabled ? 0.9 : 0, this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(settings.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
    }
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playDoubleJump(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(350, t);
    osc1.frequency.exponentialRampToValueAtTime(700, t + 0.18);
    osc2.frequency.setValueAtTime(520, t);
    osc2.frequency.exponentialRampToValueAtTime(1040, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.18);
    osc2.stop(t + 0.18);
  }

  public playWallJump(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.14);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playLand(impactRatio: number = 0): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Harder landings drop lower and hit louder for a heavier thud.
    const startFreq = 110 - impactRatio * 35;
    const endFreq = 40 - impactRatio * 12;
    const peakGain = 0.25 + impactRatio * 0.18;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(18, endFreq), t + 0.08);

    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + impactRatio * 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playWallBounce(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playCoin(comboLevel: number = 0): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const pitchIndex = Math.min(this.coinPitches.length - 1, comboLevel);
    const freq = this.coinPitches[pitchIndex];

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    osc1.frequency.setValueAtTime(freq * 1.5, t + 0.04);
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.22);
    osc2.stop(t + 0.22);
  }

  public playPowerUp(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.25, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    });
  }

  public playShieldBreak(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playDeath(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playMilestone(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chord.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.08);

      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }

  public playNewRecord(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const notes = [587, 659, 783, 880, 1174];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.07);

      gain.gain.setValueAtTime(0.35, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.4);
    });
  }

  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain || !SaveManager.getInstance().getData().settings.soundEnabled) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  public startMusic(intensity: 'normal' | 'high' | 'insane' = 'normal'): void {
    this.intensity = intensity;
    if (this.isMusicPlaying) return;

    this.initContext();
    this.isMusicPlaying = true;
    this.step = 0;

    const stepDurationMs = (60 / this.bpm / 4) * 1000;
    this.musicIntervalId = window.setInterval(() => {
      this.tickMusicStep();
    }, stepDurationMs);
  }

  public setMusicIntensity(intensity: 'normal' | 'high' | 'insane', bpm: number = 126): void {
    this.intensity = intensity;
    this.bpm = bpm;
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private tickMusicStep(): void {
    if (!this.ctx || !this.musicGain || !SaveManager.getInstance().getData().settings.musicEnabled) {
      this.step = (this.step + 1) % 16;
      return;
    }

    const t = this.ctx.currentTime;
    const s = this.step;

    const bassNotes = [110, 110, 130.81, 110, 146.83, 110, 87.31, 110];
    if (s % 2 === 0) {
      const bassFreq = bassNotes[(s / 2) % bassNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.1);
    }

    if (this.intensity !== 'normal') {
      const arpNotes = [440, 523.25, 659.25, 880, 659.25, 523.25, 440, 392];
      const arpFreq = arpNotes[s % arpNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(arpFreq, t);

      gain.gain.setValueAtTime(this.intensity === 'insane' ? 0.15 : 0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.08);
    }

    if (s % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      kickGain.gain.setValueAtTime(0.35, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);

      kickOsc.start(t);
      kickOsc.stop(t + 0.08);
    }

    if (s % 4 === 2 || (this.intensity === 'insane' && s % 2 === 1)) {
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      const hatFilter = this.ctx.createBiquadFilter();

      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(12000, t);

      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(8000, t);

      hatGain.gain.setValueAtTime(0.08, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      hatOsc.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);

      hatOsc.start(t);
      hatOsc.stop(t + 0.03);
    }

    this.step = (this.step + 1) % 16;
  }
}
