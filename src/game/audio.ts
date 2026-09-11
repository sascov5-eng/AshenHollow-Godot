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
  private noiseBuf: AudioBuffer | null = null;
  private ambient: AudioBufferSourceNode | null = null;
  private padA: OscillatorNode | null = null;
  private padB: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
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
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.002;
      comp.release.value = 0.16;
      this.music.connect(this.master);
      this.sfx.connect(comp);
      comp.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noiseBuf = this.makeNoise(1.2);
      this.apply();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  apply() {
    if (!this.master || !this.music || !this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(curve(this.settings.master) * m, t, 0.05);
    this.music.gain.setTargetAtTime(curve(this.settings.music) * 0.85, t, 0.08);
    this.sfx.gain.setTargetAtTime(curve(this.settings.sfx) * 1, t, 0.05);
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private makeNoise(sec: number) {
    if (!this.ctx) return null;
    const n = Math.floor(this.ctx.sampleRate * sec);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < n; i++) {
      b = b * 0.96 + (Math.random() * 2 - 1) * 0.35;
      d[i] = b + (Math.random() * 2 - 1) * 0.22;
    }
    return buf;
  }

  private env(g: GainNode, peak: number, dur: number, attack = 0.006, exp = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    if (exp) g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    else g.gain.linearRampToValueAtTime(0.0001, t + dur);
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slide?: number,
    attack = 0.008,
  ) {
    if (!this.ctx || !this.sfx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = Math.min(3800, freq * 5);
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(28, slide), this.ctx.currentTime + dur);
    this.env(g, gain, dur, attack);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.03);
  }

  private burst(dur: number, gain: number, type: BiquadFilterType, freq: number, q = 0.8, slide?: number) {
    if (!this.ctx || !this.sfx || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, slide), this.ctx.currentTime + dur);
    const g = this.ctx.createGain();
    this.env(g, gain, dur, 0.003);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
    src.stop(this.ctx.currentTime + dur + 0.02);
  }

  play(name: string) {
    if (!this.ctx) return;
    const r = 0.97 + Math.random() * 0.06;
    switch (name) {
      case "jump":
        this.burst(0.07, 0.11, "bandpass", 520 * r, 0.7, 180);
        this.tone(168 * r, 0.09, "triangle", 0.045, 72, 0.003);
        break;
      case "land":
        this.burst(0.1, 0.16, "lowpass", 220, 0.5);
        this.tone(54, 0.11, "sine", 0.1, 32, 0.002);
        break;
      case "dash":
        this.burst(0.16, 0.14, "highpass", 900, 0.45, 280);
        this.tone(110 * r, 0.12, "sawtooth", 0.03, 42, 0.004);
        break;
      case "slash":
        this.burst(0.08, 0.16, "bandpass", 2400 * r, 1.6, 420);
        this.burst(0.05, 0.08, "highpass", 3200, 0.8, 900);
        break;
      case "hit":
        this.burst(0.1, 0.18, "lowpass", 380, 0.8);
        this.tone(78 * r, 0.1, "triangle", 0.07, 36, 0.002);
        break;
      case "hurt":
        this.burst(0.14, 0.12, "bandpass", 420, 0.9);
        this.tone(148, 0.22, "triangle", 0.055, 52, 0.012);
        break;
      case "heal":
        this.tone(330, 0.38, "sine", 0.04, 494, 0.05);
        this.tone(415, 0.46, "sine", 0.028, 622, 0.06);
        this.burst(0.2, 0.04, "bandpass", 1800, 0.4);
        break;
      case "soul":
        this.tone(698 * r, 0.16, "sine", 0.035, 1046, 0.02);
        this.burst(0.08, 0.04, "bandpass", 1600, 0.6);
        break;
      case "wall":
        this.burst(0.05, 0.04, "bandpass", 780, 1.1);
        break;
      case "step":
        this.burst(0.035, 0.045, "lowpass", 310, 0.6);
        break;
      case "death":
        this.tone(92, 0.62, "sine", 0.08, 28, 0.03);
        this.burst(0.4, 0.1, "lowpass", 160, 0.4);
        break;
      case "win":
        this.tone(262, 0.32, "sine", 0.04, 392, 0.04);
        this.tone(330, 0.4, "sine", 0.03, 523, 0.05);
        break;
      case "ui":
        this.burst(0.04, 0.05, "bandpass", 1400, 0.7);
        this.tone(392, 0.08, "sine", 0.025, 523, 0.008);
        break;
      case "door":
        this.tone(98, 0.55, "triangle", 0.05, 147, 0.06);
        this.burst(0.28, 0.06, "lowpass", 140, 0.4);
        break;
      default:
        break;
    }
  }

  startAmbient() {
    if (!this.ctx || !this.music || this.ambient) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * 6, sr);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = last * 0.991 + (Math.random() * 2 - 1) * 0.02;
      d[i] = last * 4.4 + Math.sin(i / sr * 0.7) * 0.015;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    const g = this.ctx.createGain();
    g.gain.value = 0.07;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.music);
    src.start();
    this.ambient = src;

    const pad = (freq: number, gain: number) => {
      const o = this.ctx!.createOscillator();
      const og = this.ctx!.createGain();
      const f = this.ctx!.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 420;
      o.type = "sine";
      o.frequency.value = freq;
      og.gain.value = gain;
      o.connect(f);
      f.connect(og);
      og.connect(this.music!);
      o.start();
      return o;
    };
    this.padA = pad(36.7, 0.028);
    this.padB = pad(55, 0.018);

    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 0.07;
    lg.gain.value = 8;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
    this.lfo = lfo;

    const drip = () => {
      if (!this.ctx) return;
      this.burst(0.12, 0.018, "bandpass", 900 + Math.random() * 200, 1.4, 220);
      this.dripT = window.setTimeout(drip, 3200 + Math.random() * 5000);
    };
    this.dripT = window.setTimeout(drip, 2200);
  }

  stopAmbient() {
    try {
      this.ambient?.stop();
      this.padA?.stop();
      this.padB?.stop();
      this.lfo?.stop();
    } catch {
      /* already stopped */
    }
    if (this.dripT) window.clearTimeout(this.dripT);
    this.dripT = null;
    this.ambient = null;
    this.padA = null;
    this.padB = null;
    this.lfo = null;
  }
}
