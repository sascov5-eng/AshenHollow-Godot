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
  private ambient: AudioBufferSourceNode | null = null;
  private padA: OscillatorNode | null = null;
  private padB: OscillatorNode | null = null;
  private ambGain: GainNode | null = null;
  private dripT: number | null = null;
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
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 8;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;
      this.music.connect(this.master);
      this.sfx.connect(comp);
      comp.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  apply() {
    if (!this.master || !this.music || !this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(curve(this.settings.master) * m, t, 0.05);
    this.music.gain.setTargetAtTime(curve(this.settings.music) * 0.7, t, 0.08);
    this.sfx.gain.setTargetAtTime(curve(this.settings.sfx) * 0.9, t, 0.05);
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private env(g: GainNode, peak: number, dur: number, attack = 0.008) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private osc(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slide?: number,
    attack = 0.01,
  ) {
    if (!this.ctx || !this.sfx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = Math.min(4200, freq * 6);
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), this.ctx.currentTime + dur);
    this.env(g, gain, dur, attack);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.04);
  }

  private noise(dur: number, gain: number, type: BiquadFilterType, freq: number, q = 0.7) {
    if (!this.ctx || !this.sfx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, gain, dur, 0.004);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  play(name: string) {
    if (!this.ctx) return;
    const r = 0.96 + Math.random() * 0.08;
    switch (name) {
      case "jump":
        this.noise(0.05, 0.045, "bandpass", 900 * r, 0.8);
        this.osc(210 * r, 0.11, "sine", 0.05, 92, 0.004);
        break;
      case "land":
        this.noise(0.07, 0.07, "lowpass", 280, 0.6);
        this.osc(68, 0.09, "sine", 0.06, 38, 0.002);
        break;
      case "dash":
        this.noise(0.14, 0.08, "highpass", 700, 0.5);
        this.osc(140 * r, 0.16, "triangle", 0.04, 48, 0.006);
        break;
      case "slash":
        this.noise(0.07, 0.07, "bandpass", 2200 * r, 1.4);
        this.osc(620 * r, 0.08, "triangle", 0.035, 160, 0.002);
        break;
      case "hit":
        this.noise(0.09, 0.09, "lowpass", 420, 0.7);
        this.osc(92 * r, 0.12, "sine", 0.08, 46, 0.002);
        break;
      case "hurt":
        this.noise(0.12, 0.07, "bandpass", 500, 0.8);
        this.osc(196, 0.2, "triangle", 0.06, 70, 0.01);
        break;
      case "heal":
        this.osc(392, 0.42, "sine", 0.045, 523, 0.04);
        this.osc(523, 0.5, "sine", 0.03, 659, 0.05);
        break;
      case "soul":
        this.osc(784 * r, 0.18, "sine", 0.04, 1174, 0.02);
        break;
      case "wall":
        this.noise(0.04, 0.02, "bandpass", 1100, 1);
        break;
      case "step":
        this.noise(0.03, 0.018, "lowpass", 420, 0.5);
        break;
      case "death":
        this.osc(160, 0.55, "sine", 0.07, 42, 0.02);
        this.noise(0.3, 0.05, "lowpass", 200, 0.4);
        break;
      case "win":
        this.osc(392, 0.35, "sine", 0.045, 523, 0.03);
        this.osc(523, 0.45, "sine", 0.035, 784, 0.04);
        break;
      case "ui":
        this.osc(520, 0.07, "sine", 0.03, 660, 0.01);
        break;
      case "door":
        this.osc(130, 0.7, "sine", 0.05, 196, 0.08);
        this.noise(0.25, 0.03, "lowpass", 180, 0.4);
        break;
      default:
        break;
    }
  }

  startAmbient() {
    if (!this.ctx || !this.music || this.ambient) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * 4, sr);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.018) * 0.985;
      d[i] = last * 3.2;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 280;
    const g = this.ctx.createGain();
    g.gain.value = 0.045;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.music);
    src.start();
    this.ambient = src;
    this.ambGain = g;

    const pad = (freq: number, gain: number) => {
      const o = this.ctx!.createOscillator();
      const og = this.ctx!.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      og.gain.value = gain;
      o.connect(og);
      og.connect(this.music!);
      o.start();
      return o;
    };
    this.padA = pad(55, 0.02);
    this.padB = pad(82.4, 0.012);

    const drip = () => {
      if (!this.ctx) return;
      this.osc(1680 + Math.random() * 400, 0.18, "sine", 0.012, 420, 0.002);
      this.dripT = window.setTimeout(drip, 2800 + Math.random() * 4200);
    };
    this.dripT = window.setTimeout(drip, 1600);
  }

  stopAmbient() {
    try {
      this.ambient?.stop();
      this.padA?.stop();
      this.padB?.stop();
    } catch {
      /* already stopped */
    }
    if (this.dripT) window.clearTimeout(this.dripT);
    this.dripT = null;
    this.ambient = null;
    this.padA = null;
    this.padB = null;
    this.ambGain = null;
  }
}
