import { GROUND, MAX_FRAME, PLAYER, STEP, VIEW_H, VIEW_W, WORLD_H, WORLD_W } from "./constants";
import { animFrame, drawSheet, loadArt, type Art } from "./assets";
import { GameAudio } from "./audio";
import { Input } from "./input";
import { hitSpike, moveResolve } from "./physics";
import { loadSettings, saveSettings } from "./save";
import type { Actions, Enemy, FxBurst, Mode, Particle, Player, Settings, Solid, UiSnap } from "./types";
import { aabb, BENCH, DOOR, makeEnemies, makeProps, makeSolids, SPAWN } from "./world";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}

const HINTS = [
  { at: 0.4, text: "A / D или стик — шаг. Прыжок удерживайте для высоты." },
  { at: 8, text: "Рывок (L / Shift / кнопка) работает в воздухе." },
  { at: 16, text: "Прижмитесь к стене — скольжение и прыжок от стены." },
  { at: 24, text: "Удар наполняет душу. Удерживайте лечение, стоя на земле." },
];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function makePlayer(): Player {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    vx: 0,
    vy: 0,
    w: PLAYER.w,
    h: PLAYER.h,
    facing: 1,
    hp: PLAYER.maxHp,
    soul: 0,
    grounded: false,
    wasGrounded: false,
    wallL: false,
    wallR: false,
    coyote: 0,
    jumpBuf: 0,
    wallCoyote: 0,
    wallDir: 0,
    dashT: 0,
    dashCd: 0,
    dashVx: 0,
    dashVy: 0,
    atkT: 0,
    atkHit: false,
    healT: 0,
    healing: false,
    hurtT: 0,
    deadT: 0,
    dropT: 0,
    anim: "idle",
    animT: 0,
    squish: 1,
    sitting: false,
  };
}

export class PaleHallGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input = new Input();
  audio: GameAudio;
  settings: Settings;
  art: Art | null = null;
  solids: Solid[] = makeSolids();
  props = makeProps();
  enemies: Enemy[] = makeEnemies();
  player = makePlayer();
  particles: Particle[] = [];
  fx: FxBurst[] = [];
  mode: Mode = "loading";
  loadP = 0;
  camX = 0;
  camY = 0;
  look = 0;
  trauma = 0;
  hitstop = 0;
  time = 0;
  killed = 0;
  doorOpen = false;
  hint = HINTS[0].text;
  raf = 0;
  acc = 0;
  last = 0;
  running = false;
  stepTick = 0;
  onUi: (u: UiSnap) => void;
  showTouch = false;
  reduced = false;

  constructor(canvas: HTMLCanvasElement, onUi: (u: UiSnap) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.onUi = onUi;
    this.settings = loadSettings();
    this.audio = new GameAudio(this.settings);
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.showTouch = this.settings.touch === "on" || (this.settings.touch === "auto" && matchMedia("(pointer: coarse)").matches);
  }

  async boot() {
    this.input.attach();
    this.wireProbe();
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVis);
    this.canvas.addEventListener("pointerdown", this.onCanvasTap);
    try {
      this.art = await loadArt((n) => {
        this.loadP = n;
        this.emit();
      });
      this.mode = "title";
      this.emit();
    } catch (e) {
      console.error(e);
      this.mode = "title";
      this.emit();
    }
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    this.audio.stopAmbient();
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.canvas.removeEventListener("pointerdown", this.onCanvasTap);
    if (window.__controlsTest) delete window.__controlsTest;
  }

  private onVis = () => {
    if (document.hidden) this.input.keys.clear();
    else this.audio.resume();
  };

  private onCanvasTap = () => {
    this.audio.unlock();
    this.tapStart();
  };

  private resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth || this.canvas.getBoundingClientRect().width;
    const h = this.canvas.clientHeight || this.canvas.getBoundingClientRect().height;
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
  };

  private wireProbe() {
    window.__controlsTest = {
      getYaw: () => (this.player.facing > 0 ? 0 : Math.PI),
      getSpeed: () => Math.abs(this.player.vx) + (this.mode === "playing" ? 0 : 0),
      getX: () => this.player.x,
      getY: () => this.player.y,
      setKeys: (codes: string[]) => {
        if (this.mode === "title" || this.mode === "loading") this.begin();
        this.mode = "playing";
        this.input.setKeys(codes);
      },
      setSteer: (v: number) => {
        this.input.touchMoveX = -v;
      },
    };
  }

  goTitle() {
    this.mode = "title";
    this.emit();
  }

  tapStart() {
    if (this.mode === "title" || this.mode === "dead" || this.mode === "win") this.begin();
  }

  begin() {
    this.audio.unlock();
    this.audio.apply();
    this.audio.startAmbient();
    this.audio.play("ui");
    this.resetRun();
    this.mode = "playing";
    this.emit();
  }

  resetRun() {
    this.player = makePlayer();
    this.enemies = makeEnemies();
    this.particles = [];
    this.fx = [];
    this.killed = 0;
    this.doorOpen = false;
    this.time = 0;
    this.camX = this.player.x - VIEW_W * 0.35;
    this.camY = this.player.y - VIEW_H * 0.55;
    this.trauma = 0;
    this.hint = HINTS[0].text;
  }

  pauseToggle() {
    if (this.mode === "playing") this.mode = "paused";
    else if (this.mode === "paused") this.mode = "playing";
    this.emit();
  }

  patchSettings(p: Partial<Settings>) {
    this.settings = { ...this.settings, ...p };
    saveSettings(this.settings);
    this.audio.settings = this.settings;
    this.audio.apply();
    this.showTouch =
      this.settings.touch === "on" ||
      (this.settings.touch === "auto" && matchMedia("(pointer: coarse)").matches);
    this.emit();
  }

  emit() {
    this.onUi({
      mode: this.mode,
      hp: this.player.hp,
      maxHp: PLAYER.maxHp,
      soul: Math.floor(this.player.soul),
      maxSoul: PLAYER.maxSoul,
      dashReady: this.player.dashCd <= 0,
      killed: this.killed,
      total: 3,
      hint: this.hint,
      doorOpen: this.doorOpen,
      loading: this.loadP,
      settings: this.settings,
      showTouch: this.showTouch && (this.mode === "playing" || this.mode === "paused"),
    });
  }

  private frame = (t: number) => {
    if (!this.running) return;
    let dt = (t - this.last) / 1000;
    this.last = t;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    this.input.sample();
    if (this.mode === "playing") {
      if (this.hitstop > 0) this.hitstop -= dt;
      else {
        this.acc += dt;
        while (this.acc >= STEP) {
          this.fixed(STEP);
          this.acc -= STEP;
        }
      }
    } else {
      this.acc = 0;
      if (this.mode === "title" && (this.input.actions.jumpPressed || this.input.actions.attackPressed || this.input.actions.dashPressed)) this.begin();
    }
    if (this.input.actions.pausePressed && (this.mode === "playing" || this.mode === "paused")) {
      this.pauseToggle();
    }
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private fixed(dt: number) {
    this.time += dt;
    this.stepTick++;
    for (const h of HINTS) if (this.time >= h.at) this.hint = h.text;
    const a = this.input.actions;
    this.updatePlayer(dt, a);
    this.updateEnemies(dt);
    this.combat();
    this.updateParticles(dt);
    this.fx = this.fx.filter((f) => {
      f.t += dt;
      return f.t < f.max;
    });
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.camera(dt);
    if (this.stepTick % 8 === 0) this.emit();
  }

  private updatePlayer(dt: number, a: Actions) {
    const p = this.player;
    p.wasGrounded = p.grounded;
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.atkT = Math.max(0, p.atkT - dt);
    p.dropT = Math.max(0, p.dropT - dt);
    p.animT += dt;
    p.squish += (1 - p.squish) * Math.min(1, dt * 10);

    if (p.hp <= 0) {
      p.deadT += dt;
      p.vx *= 0.9;
      p.vy += PLAYER.gravDown * dt;
      p.anim = "hurt";
      moveResolve(p, dt, this.solids, false);
      if (p.deadT > 1.1) {
        this.mode = "dead";
        this.audio.play("death");
        this.emit();
      }
      return;
    }

    if (p.dashT > 0) {
      p.dashT -= dt;
      p.vx = p.dashVx;
      p.vy = p.dashVy;
      p.anim = "dash";
      p.healing = false;
      p.healT = 0;
      moveResolve(p, dt, this.solids, false);
      this.spawnDust(p.x + p.w / 2, p.y + p.h * 0.6, 2, "#8fd4d4");
      if (p.dashT <= 0) {
        p.vx *= 0.45;
        p.vy *= 0.3;
      }
      this.footEnv(p);
      return;
    }

    const busy = p.atkT > 0 || p.healing || p.hurtT > 0.55;
    const canAct = !busy;

    if (a.down && a.jumpPressed && p.grounded) {
      p.dropT = 0.22;
      p.jumpBuf = 0;
    }

    if (a.jumpPressed) p.jumpBuf = PLAYER.buffer;
    else p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    if (p.grounded) p.coyote = PLAYER.coyote;
    else p.coyote = Math.max(0, p.coyote - dt);
    if (p.wallL || p.wallR) {
      p.wallCoyote = PLAYER.wallCoyote;
      p.wallDir = p.wallR ? 1 : -1;
    } else p.wallCoyote = Math.max(0, p.wallCoyote - dt);

    if (canAct && Math.abs(a.moveX) > 0.2) p.facing = a.moveX > 0 ? 1 : -1;

    if (canAct && a.dashPressed && p.dashCd <= 0) {
      let dx = Math.abs(a.moveX) > 0.25 ? Math.sign(a.moveX) : p.facing;
      let dy = Math.abs(a.moveY) > 0.35 ? Math.sign(a.moveY) : 0;
      if (dx === 0 && dy === 0) dx = p.facing;
      const m = Math.hypot(dx, dy) || 1;
      p.dashVx = (dx / m) * PLAYER.dashSpeed;
      p.dashVy = (dy / m) * PLAYER.dashSpeed * 0.85;
      p.dashT = PLAYER.dashTime;
      p.dashCd = PLAYER.dashCooldown;
      p.facing = dx !== 0 ? (dx > 0 ? 1 : -1) : p.facing;
      this.audio.play("dash");
      this.trauma = Math.min(1, this.trauma + 0.18);
      this.burst("slash", p.x + p.w / 2, p.y + p.h / 2, p.facing < 0, 0.7);
      return;
    }

    if (canAct && a.attackPressed && p.atkT <= 0 && !p.healing) {
      p.atkT = PLAYER.attackTime;
      p.atkHit = false;
      p.animT = 0;
      p.vx *= 0.4;
      this.audio.play("slash");
      this.burst("slash", p.x + p.w / 2 + p.facing * 36, p.y + p.h * 0.45, p.facing < 0, 1);
    }

    if (p.grounded && a.heal && p.soul >= PLAYER.healCost && p.hp < PLAYER.maxHp && p.atkT <= 0) {
      if (!p.healing) {
        p.healing = true;
        p.healT = 0;
        p.animT = 0;
      }
      p.healT += dt;
      p.vx *= 0.4;
      if (this.stepTick % 8 === 0) this.spawnDust(p.x + p.w / 2, p.y + p.h * 0.4, 2, "#7ec8c8", "heal");
      if (p.healT >= PLAYER.healTime) {
        p.soul -= PLAYER.healCost;
        p.hp = Math.min(PLAYER.maxHp, p.hp + 1);
        p.healing = false;
        p.healT = 0;
        this.audio.play("heal");
        this.burst("heal", p.x + p.w / 2, p.y + p.h / 2, false, 1.1);
        this.emit();
      }
    } else {
      p.healing = false;
      p.healT = 0;
    }

    const wallHold =
      !p.grounded &&
      ((p.wallR && a.moveX > 0.2) || (p.wallL && a.moveX < -0.2));

    if (!p.healing && p.atkT <= 0) {
      const accel = p.grounded ? PLAYER.accel : PLAYER.airAccel;
      const target = a.moveX * PLAYER.maxSpeed;
      if (Math.abs(a.moveX) > 0.08) {
        p.vx += clamp(target - p.vx, -accel * dt, accel * dt);
      } else if (p.grounded) {
        const fr = PLAYER.friction * dt;
        if (Math.abs(p.vx) <= fr) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * fr;
      } else {
        p.vx *= 0.995;
      }
    }

    if (p.atkT <= 0 && !p.healing) {
      if (p.jumpBuf > 0 && p.coyote > 0) {
        p.vy = PLAYER.jumpVel;
        p.jumpBuf = 0;
        p.coyote = 0;
        p.grounded = false;
        p.squish = 1.22;
        this.audio.play("jump");
        this.spawnDust(p.x + p.w / 2, p.y + p.h, 5, "#c8c2b4", "dust");
      } else if (p.jumpBuf > 0 && p.wallCoyote > 0) {
        p.vy = PLAYER.wallJumpY;
        p.vx = -p.wallDir * PLAYER.wallJumpX;
        p.facing = -p.wallDir as 1 | -1;
        p.jumpBuf = 0;
        p.wallCoyote = 0;
        this.audio.play("jump");
      }
    }
    if (!a.jump && p.vy < 0) p.vy *= Math.pow(PLAYER.jumpCut, dt * 8);

    let g = p.vy < 0 ? PLAYER.gravUp : PLAYER.gravDown;
    if (Math.abs(p.vy) < PLAYER.apex && p.vy < 0) g = PLAYER.gravApex;
    if (wallHold && p.vy > 0) {
      p.vy = Math.min(p.vy, PLAYER.wallSlide);
      if (this.stepTick % 6 === 0) this.audio.play("wall");
    } else {
      p.vy += g * dt;
    }
    p.vy = Math.min(p.vy, PLAYER.maxFall);

    moveResolve(p, dt, this.solids, p.dropT > 0 || (a.down && !p.grounded));

    if (p.grounded && !p.wasGrounded && p.vy >= -10) {
      p.squish = 0.78;
      this.audio.play("land");
      this.spawnDust(p.x + p.w / 2, p.y + p.h, 6, "#b7b0a2", "dust");
    }

    if (hitSpike(p, this.solids) && p.hurtT <= 0 && p.dashT <= 0) {
      this.hurt(1, p.x < 1740 ? -1 : 1);
      p.vy = PLAYER.jumpVel * 0.72;
    }

    if (p.y > WORLD_H + 40) this.hurt(99, 0);

    const onBench = aabb(p, BENCH) && p.grounded;
    p.sitting = onBench && Math.abs(p.vx) < 20 && p.atkT <= 0;
    if (p.sitting && p.hp < PLAYER.maxHp) {
      p.hp = PLAYER.maxHp;
      this.audio.play("heal");
      this.emit();
    }

    if (this.doorOpen && aabb(p, { x: DOOR.x + 20, y: DOOR.y, w: DOOR.w - 40, h: DOOR.h })) {
      this.mode = "win";
      this.audio.play("win");
      this.emit();
    }

    this.pickAnim(p, a, wallHold);
    this.footEnv(p);
  }

  private pickAnim(p: Player, a: Actions, wallHold: boolean) {
    let next: Player["anim"] = "idle";
    if (p.hurtT > 0.5) next = "hurt";
    else if (p.healing || p.sitting) next = "heal";
    else if (p.atkT > 0) next = "attack";
    else if (p.dashT > 0) next = "dash";
    else if (wallHold) next = "wall";
    else if (!p.grounded) next = "jump";
    else if (Math.abs(p.vx) > 22 || Math.abs(a.moveX) > 0.18) next = "run";
    if (next !== p.anim) {
      p.anim = next;
      p.animT = 0;
    }
  }

  private footEnv(p: Player) {
    if (p.grounded && p.anim === "run" && this.stepTick % 12 === 0) this.audio.play("step");
    if (p.x < 36) p.x = 36;
    if (p.x + p.w > WORLD_W - 36) p.x = WORLD_W - 36 - p.w;
  }

  private hurt(n: number, dir: number) {
    const p = this.player;
    if (p.dashT > 0) return;
    if (p.hurtT > 0) return;
    p.hp -= n;
    p.hurtT = PLAYER.iFrames;
    p.healing = false;
    p.vx = dir * PLAYER.knock;
    p.vy = -180;
    p.anim = "hurt";
    p.animT = 0;
    this.audio.play("hurt");
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.hitstop = 0.06;
    this.spawnDust(p.x + p.w / 2, p.y + p.h / 2, 10, "#c45c5c", "spark");
    this.emit();
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    for (const e of this.enemies) {
      e.animT += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.atkCd = Math.max(0, e.atkCd - dt);
      if (!e.alive) {
        e.deadT += dt;
        e.vy += 900 * dt;
        e.y += e.vy * dt;
        continue;
      }
      e.stateT += dt;
      if (e.state === "hurt") {
        e.vx *= 0.9;
        if (e.stateT > 0.22) e.state = e.kind === "veilfly" ? "idle" : "walk";
      }
      if (e.kind === "gloommite") this.aiCrawler(e, p, dt);
      if (e.kind === "veilfly") this.aiFly(e, p, dt);
      if (e.kind === "sentinel") this.aiSentinel(e, p, dt);
    }
  }

  private aiCrawler(e: Enemy, p: Player, dt: number) {
    if (e.state === "hurt") {
      e.x += e.vx * dt;
      return;
    }
    const dist = p.x + p.w / 2 - (e.x + e.w / 2);
    const near = Math.abs(dist) < 90 && Math.abs(p.y - e.y) < 50;
    if (e.state === "attack") {
      if (e.stateT < 0.18) e.vx = 0;
      else if (e.stateT < 0.32) e.vx = e.facing * 220;
      else e.vx *= 0.8;
      e.x += e.vx * dt;
      if (e.stateT > 0.7) {
        e.state = "walk";
        e.atkCd = 0.9;
      }
      return;
    }
    if (near && e.atkCd <= 0) {
      e.state = "attack";
      e.stateT = 0;
      e.facing = dist > 0 ? 1 : -1;
      e.animT = 0;
      return;
    }
    e.state = "walk";
    if (e.x < e.patrolL) e.facing = 1;
    if (e.x + e.w > e.patrolR) e.facing = -1;
    e.vx = e.facing * 55;
    e.x += e.vx * dt;
    e.y = e.homeY;
  }

  private aiFly(e: Enemy, p: Player, dt: number) {
    if (e.state === "hurt") return;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;
    if (e.state === "attack") {
      e.vx = e.facing * 210;
      e.vy = 240;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.y > GROUND - 40 || e.stateT > 0.85) {
        e.state = "idle";
        e.atkCd = 1.4;
      }
      return;
    }
    e.state = "idle";
    if (e.x < e.patrolL) e.facing = 1;
    if (e.x > e.patrolR) e.facing = -1;
    e.x += e.facing * 48 * dt;
    e.y = e.homeY + Math.sin(this.time * 2.2 + 1.2) * 28;
    if (e.atkCd <= 0 && Math.abs(px - cx) < 70 && py > cy && py < cy + 280) {
      e.state = "attack";
      e.stateT = 0;
      e.facing = px > cx ? 1 : -1;
      e.animT = 0;
    }
  }

  private aiSentinel(e: Enemy, p: Player, dt: number) {
    if (e.state === "hurt") {
      e.x += e.vx * dt;
      return;
    }
    const dist = p.x + p.w / 2 - (e.x + e.w / 2);
    const near = Math.abs(dist) < 86 && Math.abs(p.y + p.h - (e.y + e.h)) < 40;
    if (e.state === "attack") {
      e.vx = 0;
      if (e.stateT > 0.85) {
        e.state = "walk";
        e.atkCd = 1.1;
      }
      return;
    }
    if (near && e.atkCd <= 0) {
      e.state = "attack";
      e.stateT = 0;
      e.facing = dist > 0 ? 1 : -1;
      e.animT = 0;
      return;
    }
    e.state = "walk";
    if (e.x < e.patrolL) e.facing = 1;
    if (e.x + e.w > e.patrolR) e.facing = -1;
    e.vx = e.facing * 34;
    e.x += e.vx * dt;
    e.y = e.homeY;
  }

  private combat() {
    const p = this.player;
    const invuln = p.hurtT > 0 || p.dashT > 0;
    if (p.atkT > 0 && !p.atkHit && p.atkT < PLAYER.attackTime - PLAYER.attackHit0 && p.atkT > PLAYER.attackTime - PLAYER.attackHit1) {
      const hx = p.facing > 0 ? p.x + p.w : p.x - 46;
      const hit = { x: hx, y: p.y + 4, w: 46, h: p.h - 6 };
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (!aabb(hit, e)) continue;
        p.atkHit = true;
        e.hp -= 1;
        e.flash = 0.12;
        e.state = "hurt";
        e.stateT = 0;
        e.vx = p.facing * 140;
        e.facing = -p.facing as 1 | -1;
        p.soul = Math.min(PLAYER.maxSoul, p.soul + PLAYER.soulHit);
        this.audio.play("hit");
        this.audio.play("soul");
        this.trauma = Math.min(1, this.trauma + 0.28);
        this.hitstop = 0.045;
        this.burst("impact", e.x + e.w / 2, e.y + e.h / 2, p.facing < 0, 1);
        this.spawnDust(e.x + e.w / 2, e.y + e.h / 2, 8, "#7ec8c8", "soul");
        if (e.hp <= 0) {
          e.alive = false;
          e.deadT = 0;
          e.vy = -120;
          this.killed += 1;
          p.soul = Math.min(PLAYER.maxSoul, p.soul + 8);
          if (this.killed >= 3 && !this.doorOpen) {
            this.doorOpen = true;
            this.hint = "Печать пала. Идите к двери справа.";
            this.audio.play("door");
          }
          this.emit();
        }
      }
    }

    if (invuln) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      let box = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (e.kind === "sentinel" && e.state === "attack" && e.stateT > 0.18 && e.stateT < 0.42) {
        box = { x: e.facing > 0 ? e.x + e.w : e.x - 40, y: e.y + 16, w: 40, h: 22 };
      }
      if (aabb(p, box)) this.hurt(1, p.x < e.x ? -1 : 1);
    }
  }

  private burst(sheet: FxBurst["sheet"], x: number, y: number, flip: boolean, scale: number) {
    this.fx.push({ x, y, t: 0, max: 0.28, sheet, flip, scale });
  }

  private spawnDust(x: number, y: number, n: number, color: string, kind: Particle["kind"] = "dust") {
    if (this.settings.quality === "low") n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 80,
        vy: -30 - Math.random() * 70,
        life: 0.3 + Math.random() * 0.4,
        max: 0.5,
        size: 2 + Math.random() * 3,
        color,
        g: kind === "soul" || kind === "heal" ? -40 : 220,
        kind,
      });
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }

  private updateParticles(dt: number) {
    for (const q of this.particles) {
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += q.g * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    if (this.settings.quality === "high" && this.stepTick % 4 === 0) {
      this.particles.push({
        x: this.camX + Math.random() * VIEW_W,
        y: this.camY + Math.random() * VIEW_H,
        vx: (Math.random() - 0.5) * 8,
        vy: -6 - Math.random() * 10,
        life: 3,
        max: 3,
        size: 1.6,
        color: "rgba(190,220,214,0.4)",
        g: 0,
        kind: "mote",
      });
    }
  }

  private camera(dt: number) {
    const p = this.player;
    this.look += (p.facing * 46 - this.look) * (1 - Math.exp(-4 * dt));
    const tx = p.x + p.w / 2 - VIEW_W * 0.36 + this.look;
    const ty = p.y + p.h / 2 - VIEW_H * 0.62;
    this.camX += (tx - this.camX) * (1 - Math.exp(-7.2 * dt));
    this.camY += (ty - this.camY) * (1 - Math.exp(-6.4 * dt));
    this.camX = clamp(this.camX, 0, Math.max(0, WORLD_W - VIEW_W));
    this.camY = clamp(this.camY, 0, Math.max(0, WORLD_H - VIEW_H));
  }

  private draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / VIEW_W, height / VIEW_H);
    const ox = (width - VIEW_W * scale) / 2;
    const oy = (height - VIEW_H * scale) / 2;
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();

    const shake = this.reduced ? 0 : this.trauma * this.trauma * 14 * this.settings.shake;
    const sx = (Math.random() * 2 - 1) * shake;
    const sy = (Math.random() * 2 - 1) * shake;
    const camX = this.camX + sx;
    const camY = this.camY + sy;

    const art = this.art;
    if (art) {
      ctx.drawImage(art.sky, 0, 0, VIEW_W, VIEW_H);
      this.drawParallax(art.far, camX * 0.18, camY * 0.08, 0.92);
      this.drawParallax(art.mid, camX * 0.38, camY * 0.16, 0.88);
    } else {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawWorld(art);
    this.drawEntities(art);
    for (const q of this.particles) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, q.size, q.size);
    }
    ctx.globalAlpha = 1;
    if (art) {
      for (const f of this.fx) {
        const fr = Math.min(3, Math.floor((f.t / f.max) * 4));
        const s = 70 * f.scale;
        drawSheet(ctx, art.fx[f.sheet], fr, f.x - s / 2, f.y - s / 2, s, s, f.flip, 1 - f.t / f.max);
      }
    }
    ctx.restore();

    if (art && this.settings.quality === "high") {
      ctx.globalAlpha = 0.28;
      this.drawParallax(art.near, camX * 0.72, camY * 0.22, 1);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "rgba(6,8,14,0.18)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const vg = ctx.createRadialGradient(VIEW_W * 0.5, VIEW_H * 0.46, VIEW_H * 0.12, VIEW_W * 0.5, VIEW_H * 0.5, VIEW_W * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(0.7, "rgba(4,6,12,0.18)");
    vg.addColorStop(1, "rgba(3,4,8,0.58)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.mode === "title" || this.mode === "loading") this.drawTitleChrome();
  }

  private drawTitleChrome() {
    const ctx = this.ctx;
    const t = performance.now() / 1000;
    ctx.fillStyle = "rgba(6,8,14,0.55)";
    ctx.fillRect(0, VIEW_H - 110, VIEW_W, 110);
    ctx.fillStyle = "#8a8d96";
    ctx.font = "11px ui-monospace, Menlo, monospace";
    ctx.fillText("CLOSED BETA 0.9", 28, VIEW_H - 78);
    ctx.fillStyle = "#e8e4d8";
    ctx.font = "italic 42px Georgia, 'Times New Roman', serif";
    ctx.fillText("Pale Hall", 24, VIEW_H - 38);
    ctx.globalAlpha = this.mode === "loading" ? 0.55 : 0.7 + Math.sin(t * 3.2) * 0.3;
    ctx.fillStyle = "#c8ccd4";
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText(this.mode === "loading" ? "Сборка зала…" : "Нажмите по залу, чтобы начать", 28, VIEW_H - 14);
    ctx.globalAlpha = 1;
  }

  private drawParallax(img: HTMLImageElement, x: number, y: number, dark: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.filter = dark < 1 ? `brightness(${dark})` : "none";
    const w = VIEW_W * 1.15;
    const h = VIEW_H * 1.1;
    const dx = -((x % w) + w) % w;
    ctx.drawImage(img, dx, -20 - y * 0.2, w, h);
    ctx.drawImage(img, dx + w - 2, -20 - y * 0.2, w, h);
    ctx.filter = "none";
    ctx.restore();
  }

  private drawWorld(art: Art | null) {
    const ctx = this.ctx;
    if (!art) {
      ctx.fillStyle = "#2a3038";
      for (const s of this.solids) ctx.fillRect(s.x, s.y, s.w, s.h);
      return;
    }
    const tile = (img: HTMLImageElement, r: Solid, size: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      for (let y = r.y; y < r.y + r.h; y += size) {
        for (let x = r.x; x < r.x + r.w; x += size) {
          ctx.drawImage(img, x, y, size + 1, size + 1);
        }
      }
      ctx.restore();
    };
    for (const s of this.solids) {
      if (s.kind === "ground" || s.kind === "plat") tile(art.floor, s, 72);
      else if (s.kind === "wall" || s.kind === "ceiling") tile(art.wall, s, 88);
    }
    const pit = ctx.createLinearGradient(0, GROUND - 40, 0, WORLD_H);
    pit.addColorStop(0, "rgba(8,12,18,0)");
    pit.addColorStop(1, "rgba(4,6,10,0.72)");
    ctx.fillStyle = pit;
    ctx.fillRect(710, GROUND - 20, 350, WORLD_H - GROUND + 20);
    const imgOf = (n: (typeof this.props)[number]["img"]) =>
      ({
        lantern: art.lantern,
        moss: art.moss,
        crystal: art.crystal,
        bones: art.bones,
        bench: art.bench,
        door: art.door,
        spikes: art.spikes,
        platform: art.platform,
      })[n];
    for (const pr of this.props) {
      if (pr.img === "lantern") {
        const gx = pr.x + pr.w / 2;
        const gy = pr.y + pr.h * 0.7;
        const glow = ctx.createRadialGradient(gx, gy, 4, gx, gy, 90);
        glow.addColorStop(0, "rgba(170, 210, 200, 0.28)");
        glow.addColorStop(0.45, "rgba(90, 140, 130, 0.1)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(gx - 90, gy - 90, 180, 180);
      }
      const img = imgOf(pr.img);
      if (pr.img === "door" && this.doorOpen) {
        ctx.save();
        ctx.filter = "brightness(1.35) saturate(1.2)";
        ctx.drawImage(img, pr.x, pr.y, pr.w, pr.h);
        ctx.restore();
        ctx.strokeStyle = "rgba(126,200,200,0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(pr.x + 18, pr.y + 30, pr.w - 36, pr.h - 48);
      } else {
        ctx.drawImage(img, pr.x, pr.y, pr.w, pr.h);
      }
    }
    ctx.globalAlpha = 0.75;
    for (const x of [160, 380, 560, 880, 1180, 1360, 1720, 1880]) {
      ctx.drawImage(art.moss, x, 22, 22 + (x % 18), 70 + (x % 40));
    }
    ctx.globalAlpha = 1;
  }

  private drawEntities(art: Art | null) {
    const ctx = this.ctx;
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive && e.deadT > 0.8) continue;
      const alpha = e.alive ? 1 : Math.max(0, 1 - e.deadT / 0.8);
      const blink = e.flash > 0 ? 0.55 + Math.sin(e.flash * 80) * 0.45 : 1;
      ctx.globalAlpha = alpha * blink;
      if (!art) {
        ctx.fillStyle = e.kind === "gloommite" ? "#3d5c45" : e.kind === "veilfly" ? "#c8c4b8" : "#d7d2c8";
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.globalAlpha = 1;
        continue;
      }
      const pack =
        e.kind === "gloommite" ? art.gloommite : e.kind === "veilfly" ? art.veilfly : art.sentinel;
      let sh = pack.idle || pack.hover || pack.walk;
      let fps = 8;
      if (e.kind === "veilfly") {
        sh = e.state === "attack" ? art.veilfly.attack : art.veilfly.hover;
        fps = e.state === "attack" ? 12 : 10;
      } else if (e.state === "attack") {
        sh = pack.attack;
        fps = 11;
      } else if (e.state === "walk") {
        sh = pack.walk ?? pack.idle;
        fps = 8;
      }
      const fr = animFrame(e.animT, sh.cols * sh.rows, fps, e.state !== "attack");
      const dw = e.kind === "sentinel" ? 84 : e.kind === "gloommite" ? 86 : 70;
      const dh = e.kind === "sentinel" ? 100 : e.kind === "gloommite" ? 56 : 62;
      drawSheet(ctx, sh, fr, e.x + e.w / 2 - dw / 2, e.y + e.h - dh + 4, dw, dh, e.facing < 0);
      ctx.globalAlpha = 1;
    }

    const blink = p.hurtT > 0 && p.hp > 0 ? (Math.floor(p.hurtT * 20) % 2 === 0 ? 0.45 : 1) : 1;
    ctx.globalAlpha = blink;
    if (!art) {
      ctx.fillStyle = "#e8e4d8";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1;
      return;
    }
    const sh = art.warden[p.anim] ?? art.warden.idle;
    const n = sh.cols * sh.rows;
    let fr = animFrame(p.animT, n, p.anim === "run" ? 11 : p.anim === "dash" ? 14 : 7, p.anim !== "jump" && p.anim !== "attack");
    if (p.anim === "jump") {
      if (p.vy < -90) fr = 1;
      else if (Math.abs(p.vy) <= 90) fr = Math.min(2, n - 1);
      else fr = Math.min(3, n - 1);
    }
    if (p.anim === "attack") fr = Math.min(n - 1, Math.floor(((PLAYER.attackTime - p.atkT) / PLAYER.attackTime) * n));
    const dw = 78 * (p.anim === "dash" ? 1.1 : 1);
    const dh = 78 * p.squish;
    const dx = p.x + p.w / 2 - dw / 2;
    const dy = p.y + p.h - dh + 4;
    drawSheet(ctx, sh, fr, dx, dy, dw, dh, p.facing < 0);
    ctx.globalAlpha = 1;
  }
}
