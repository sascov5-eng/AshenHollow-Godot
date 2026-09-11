import type { Settings } from "./types";

function curve(v: number) {
  return v * v;
}

export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  sfx: GainNode | null = null;
  settings: Settings;
  private ambient: OscillatorNode | null = null;
  private ambGain: GainNode | null = null;
  private amb2: OscillatorNode | null = null;
  muted = false;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  apply() {
    if (!this.master || !this.music || !this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(curve(this.settings.master) * m, t, 0.04);
    this.music.gain.setTargetAtTime(curve(this.settings.music) * 0.45, t, 0.04);
    this.sfx.gain.setTargetAtTime(curve(this.settings.sfx), t, 0.04);
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.12,
    slide?: number,
    bus: "sfx" | "music" = "sfx",
  ) {
    if (!this.ctx || !this.sfx || !this.music) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), this.ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(bus === "sfx" ? this.sfx : this.music);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }

  private noise(dur: number, gain = 0.08, hp = 400) {
    if (!this.ctx || !this.sfx) return;
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  play(name: string) {
    if (!this.ctx) return;
    const r = 0.92 + Math.random() * 0.16;
    switch (name) {
      case "jump":
        this.tone(420 * r, 0.12, "square", 0.06, 220);
        break;
      case "land":
        this.noise(0.08, 0.06, 180);
        this.tone(90, 0.1, "sine", 0.08, 50);
        break;
      case "dash":
        this.noise(0.16, 0.1, 600);
        this.tone(180 * r, 0.18, "sawtooth", 0.05, 80);
        break;
      case "slash":
        this.noise(0.08, 0.07, 1200);
        this.tone(880 * r, 0.09, "square", 0.05, 240);
        break;
      case "hit":
        this.tone(140 * r, 0.12, "square", 0.1, 70);
        this.noise(0.1, 0.09, 300);
        break;
      case "hurt":
        this.tone(220, 0.22, "sawtooth", 0.09, 90);
        break;
      case "heal":
        this.tone(523, 0.35, "sine", 0.06, 784);
        this.tone(659, 0.4, "sine", 0.04, 988);
        break;
      case "soul":
        this.tone(990 * r, 0.16, "sine", 0.05, 1400);
        break;
      case "wall":
        this.noise(0.05, 0.03, 800);
        break;
      case "step":
        this.noise(0.04, 0.025, 500);
        break;
      case "death":
        this.tone(180, 0.5, "sawtooth", 0.08, 50);
        break;
      case "win":
        this.tone(523, 0.4, "sine", 0.06, 784);
        this.tone(659, 0.5, "sine", 0.05, 1046);
        break;
      case "ui":
        this.tone(640, 0.08, "sine", 0.04, 880);
        break;
      case "door":
        this.tone(196, 0.6, "triangle", 0.07, 392);
        break;
      default:
        break;
    }
  }

  startAmbient() {
    if (!this.ctx || !this.music || this.ambient) return;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o2.type = "triangle";
    o.frequency.value = 55;
    o2.frequency.value = 82.4;
    g.gain.value = 0.035;
    o.connect(g);
    o2.connect(g);
    g.connect(this.music);
    o.start();
    o2.start();
    this.ambient = o;
    this.amb2 = o2;
    this.ambGain = g;
  }

  stopAmbient() {
    try {
      this.ambient?.stop();
      this.amb2?.stop();
    } catch {
      /* already stopped */
    }
    this.ambient = null;
    this.amb2 = null;
  }
}
