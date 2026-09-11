import { GROUND, WORLD_H, WORLD_W } from "./constants";
import type { Enemy, PropDraw, Rect, Solid } from "./types";

export const SPAWN = { x: 210, y: GROUND - 80 };
export const BENCH = { x: 150, y: GROUND - 70, w: 90, h: 70 };
export const DOOR = { x: 3380, y: GROUND - 210, w: 110, h: 210 };

export function makeSolids(): Solid[] {
  return [
    { x: 0, y: 0, w: 48, h: GROUND, kind: "wall" },
    { x: WORLD_W - 48, y: 0, w: 48, h: GROUND, kind: "wall" },
    { x: 0, y: 0, w: WORLD_W, h: 36, kind: "ceiling" },
    { x: 48, y: GROUND, w: 1460, h: WORLD_H - GROUND, kind: "ground" },
    { x: 1960, y: GROUND, w: WORLD_W - 1960 - 48, h: WORLD_H - GROUND, kind: "ground" },
    { x: 1508, y: 1040, w: 452, h: 60, kind: "spike", spike: true },
    { x: 240, y: 720, w: 260, h: 26, kind: "plat", oneWay: true },
    { x: 640, y: 580, w: 300, h: 26, kind: "plat", oneWay: true },
    { x: 1100, y: 450, w: 250, h: 26, kind: "plat", oneWay: true },
    { x: 1480, y: 670, w: 400, h: 26, kind: "plat", oneWay: true },
    { x: 2260, y: 360, w: 36, h: GROUND - 360, kind: "wall" },
    { x: 2510, y: 360, w: 36, h: GROUND - 360, kind: "wall" },
    { x: 2546, y: 360, w: 230, h: 26, kind: "plat", oneWay: true },
    { x: 2920, y: 640, w: 300, h: 26, kind: "plat", oneWay: true },
    { x: 3220, y: 500, w: 180, h: 26, kind: "plat", oneWay: true },
    { x: 1880, y: 320, w: 220, h: 26, kind: "plat", oneWay: true },
  ];
}

export function makeProps(): PropDraw[] {
  return [
    { img: "bench", x: BENCH.x, y: BENCH.y, w: BENCH.w, h: BENCH.h, z: 2 },
    { img: "door", x: DOOR.x, y: DOOR.y, w: DOOR.w, h: DOOR.h, z: 1 },
    { img: "spikes", x: 1520, y: 990, w: 430, h: 70, z: 3 },
    { img: "lantern", x: 90, y: 620, w: 44, h: 70, z: 2 },
    { img: "lantern", x: 2140, y: 700, w: 40, h: 64, z: 2 },
    { img: "lantern", x: 3300, y: 620, w: 40, h: 64, z: 2 },
    { img: "moss", x: 280, y: 668, w: 90, h: 56, z: 3 },
    { img: "moss", x: 700, y: 528, w: 80, h: 52, z: 3 },
    { img: "moss", x: 2288, y: 300, w: 70, h: 70, z: 3 },
    { img: "crystal", x: 1180, y: 392, w: 48, h: 58, z: 2 },
    { img: "crystal", x: 1900, y: 262, w: 44, h: 54, z: 2 },
    { img: "bones", x: 980, y: GROUND - 46, w: 80, h: 48, z: 2 },
    { img: "bones", x: 2680, y: GROUND - 44, w: 72, h: 44, z: 2 },
    { img: "platform", x: 240, y: 708, w: 260, h: 42, z: 1 },
    { img: "platform", x: 640, y: 568, w: 300, h: 42, z: 1 },
    { img: "platform", x: 1100, y: 438, w: 250, h: 42, z: 1 },
    { img: "platform", x: 1480, y: 658, w: 400, h: 42, z: 1 },
    { img: "platform", x: 2546, y: 348, w: 230, h: 42, z: 1 },
    { img: "platform", x: 2920, y: 628, w: 300, h: 42, z: 1 },
    { img: "platform", x: 3220, y: 488, w: 180, h: 40, z: 1 },
    { img: "platform", x: 1880, y: 308, w: 220, h: 40, z: 1 },
  ];
}

export function makeEnemies(): Enemy[] {
  return [
    {
      id: "gloommite",
      kind: "gloommite",
      x: 720,
      y: GROUND - 34,
      w: 52,
      h: 32,
      vx: 55,
      vy: 0,
      facing: 1,
      hp: 3,
      maxHp: 3,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 420,
      patrolR: 1380,
      homeY: GROUND - 34,
      atkCd: 0,
      flash: 0,
      deadT: 0,
    },
    {
      id: "veilfly",
      kind: "veilfly",
      x: 1280,
      y: 330,
      w: 40,
      h: 32,
      vx: 40,
      vy: 0,
      facing: 1,
      hp: 2,
      maxHp: 2,
      alive: true,
      state: "idle",
      stateT: 0,
      animT: 0,
      patrolL: 980,
      patrolR: 1680,
      homeY: 330,
      atkCd: 1.2,
      flash: 0,
      deadT: 0,
    },
    {
      id: "sentinel",
      kind: "sentinel",
      x: 3000,
      y: GROUND - 68,
      w: 28,
      h: 64,
      vx: 32,
      vy: 0,
      facing: -1,
      hp: 5,
      maxHp: 5,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 2700,
      patrolR: 3340,
      homeY: GROUND - 68,
      atkCd: 0,
      flash: 0,
      deadT: 0,
    },
  ];
}

export function aabb(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function overlaps(x: number, y: number, w: number, h: number, b: Rect) {
  return x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y;
}
