import type { Actions } from "./types";

const GAME_CODES = new Set([
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyF",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyI",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Escape",
  "KeyP",
  "KeyV",
]);

function radial(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const s = ((m - dz) / (1 - dz)) / m;
  return { x: x * s, y: y * s };
}

export class Input {
  keys = new Set<string>();
  injected: string[] | null = null;
  touchMoveX = 0;
  touchMoveY = 0;
  touchJump = false;
  touchAttack = false;
  touchDash = false;
  touchHeal = false;
  touchDown = false;
  private prevJump = false;
  private prevAttack = false;
  private prevDash = false;
  private prevPause = false;
  actions: Actions = {
    moveX: 0,
    moveY: 0,
    jump: false,
    jumpPressed: false,
    attack: false,
    attackPressed: false,
    dash: false,
    dashPressed: false,
    heal: false,
    down: false,
    pausePressed: false,
  };

  attach() {
    const down = (e: KeyboardEvent) => {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    this._off = () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }

  private _off: (() => void) | null = null;

  detach() {
    this._off?.();
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  sample() {
    const held = this.injected ?? [...this.keys];
    const has = (c: string) => (this.injected ? this.injected.includes(c) : this.keys.has(c));

    let mx = this.touchMoveX;
    let my = this.touchMoveY;
    if (has("KeyA") || has("ArrowLeft")) mx -= 1;
    if (has("KeyD") || has("ArrowRight")) mx += 1;
    if (has("KeyW") || has("ArrowUp")) my -= 1;
    if (has("KeyS") || has("ArrowDown")) my += 1;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() ?? [] : [];
    for (const p of pads) {
      if (!p || p.mapping !== "standard") continue;
      const st = radial(p.axes[0] ?? 0, p.axes[1] ?? 0);
      mx += st.x;
      my += st.y;
      if (p.buttons[14]?.pressed) mx -= 1;
      if (p.buttons[15]?.pressed) mx += 1;
      if (p.buttons[12]?.pressed) my -= 1;
      if (p.buttons[13]?.pressed) my += 1;
    }

    mx = Math.max(-1, Math.min(1, mx));
    my = Math.max(-1, Math.min(1, my));

    let jump = this.touchJump || has("Space") || has("KeyW") || has("KeyK") || has("KeyX") || has("ArrowUp");
    let attack = this.touchAttack || has("KeyZ") || has("KeyJ");
    let dash = this.touchDash || has("KeyC") || has("KeyL") || has("ShiftLeft") || has("ShiftRight");
    let heal = this.touchHeal || has("KeyF") || has("KeyI") || has("KeyV");
    let down = this.touchDown || has("KeyS") || has("ArrowDown");
    let pause = has("Escape") || has("KeyP");

    for (const p of pads) {
      if (!p || p.mapping !== "standard") continue;
      if (p.buttons[0]?.pressed) jump = true;
      if (p.buttons[2]?.pressed) attack = true;
      if (p.buttons[1]?.pressed || p.buttons[5]?.pressed) dash = true;
      if (p.buttons[3]?.pressed) heal = true;
      if (p.buttons[9]?.pressed) pause = true;
    }

    this.actions = {
      moveX: mx,
      moveY: my,
      jump,
      jumpPressed: jump && !this.prevJump,
      attack,
      attackPressed: attack && !this.prevAttack,
      dash,
      dashPressed: dash && !this.prevDash,
      heal,
      down,
      pausePressed: pause && !this.prevPause,
    };
    this.prevJump = jump;
    this.prevAttack = attack;
    this.prevDash = dash;
    this.prevPause = pause;
    void held;
    return this.actions;
  }
}
