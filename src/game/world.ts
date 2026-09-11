import { GROUND, WORLD_H, WORLD_W } from "./constants";
import type { Enemy, PropDraw, Rect, Solid } from "./types";

export const SPAWN = { x: 110, y: GROUND - 48 };
export const BENCH = { x: 48, y: GROUND - 52, w: 78, h: 52 };
export const DOOR = { x: 1396, y: GROUND - 168, w: 88, h: 168 };
export const PIT_L = 520;
export const PIT_R = 820;

/** Stairs the knight can actually hop. Full jump ~135px, tap ~70px. */
const PLATS: Array<[number, number, number]> = [
  [188, GROUND - 58, 120],
  [330, GROUND - 102, 110],
  [470, GROUND - 78, 100],
  [560, GROUND - 124, 96],
  [668, GROUND - 88, 92],
  [770, GROUND - 132, 100],
  [880, GROUND - 72, 130],
  [1028, GROUND - 118, 96],
  [1140, GROUND - 168, 88],
  [1288, GROUND - 96, 110],
];

export function makeSolids(): Solid[] {
  const solids: Solid[] = [
    { x: 0, y: 0, w: 28, h: GROUND, kind: "wall" },
    { x: WORLD_W - 28, y: 0, w: 28, h: GROUND, kind: "wall" },
    { x: 0, y: 0, w: WORLD_W, h: 22, kind: "ceiling" },
    { x: 28, y: GROUND, w: PIT_L - 28, h: WORLD_H - GROUND, kind: "ground" },
    { x: PIT_R, y: GROUND, w: WORLD_W - 28 - PIT_R, h: WORLD_H - GROUND, kind: "ground" },
    { x: PIT_L, y: GROUND + 22, w: PIT_R - PIT_L, h: 40, kind: "spike", spike: true },
    { x: 1168, y: 148, w: 22, h: GROUND - 148, kind: "wall" },
    { x: 1236, y: 148, w: 22, h: GROUND - 148, kind: "wall" },
  ];
  for (const [x, y, w] of PLATS) {
    solids.push({ x, y, w, h: 18, kind: "plat", oneWay: true });
  }
  return solids;
}

export function makeProps(): PropDraw[] {
  const props: PropDraw[] = [
    { img: "bench", x: BENCH.x, y: BENCH.y, w: BENCH.w, h: BENCH.h, z: 2 },
    { img: "door", x: DOOR.x, y: DOOR.y, w: DOOR.w, h: DOOR.h, z: 1 },
    { img: "spikes", x: PIT_L + 6, y: GROUND - 6, w: PIT_R - PIT_L - 12, h: 46, z: 3 },
    { img: "lantern", x: 40, y: 268, w: 30, h: 50, z: 2 },
    { img: "lantern", x: 498, y: 196, w: 28, h: 46, z: 2 },
    { img: "lantern", x: 1172, y: 108, w: 28, h: 46, z: 2 },
    { img: "lantern", x: 1368, y: 248, w: 28, h: 46, z: 2 },
    { img: "crystal", x: 250, y: GROUND - 96, w: 34, h: 42, z: 2 },
    { img: "crystal", x: 790, y: GROUND - 172, w: 32, h: 40, z: 2 },
    { img: "crystal", x: 1304, y: GROUND - 136, w: 32, h: 40, z: 2 },
    { img: "bones", x: 300, y: GROUND - 34, w: 58, h: 36, z: 2 },
    { img: "bones", x: 940, y: GROUND - 34, w: 54, h: 34, z: 2 },
    { img: "bones", x: 1320, y: GROUND - 34, w: 56, h: 34, z: 2 },
    { img: "moss", x: 70, y: GROUND - 30, w: 70, h: 34, z: 3 },
    { img: "moss", x: 430, y: GROUND - 28, w: 64, h: 32, z: 3 },
    { img: "moss", x: 900, y: GROUND - 28, w: 68, h: 32, z: 3 },
    { img: "moss", x: 1260, y: GROUND - 28, w: 64, h: 32, z: 3 },
  ];
  for (const [x, y, w] of PLATS) {
    props.push({ img: "platform", x: x - 6, y: y - 10, w: w + 12, h: 30, z: 1 });
    props.push({ img: "moss", x: x + 8, y: y - 24, w: Math.min(56, w - 16), h: 26, z: 3 });
  }
  return props;
}

export function makeEnemies(): Enemy[] {
  return [
    {
      id: "gloommite",
      kind: "gloommite",
      x: 360,
      y: GROUND - 28,
      w: 44,
      h: 26,
      vx: 42,
      vy: 0,
      facing: 1,
      hp: 3,
      maxHp: 3,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 70,
      patrolR: 500,
      homeY: GROUND - 28,
      atkCd: 0,
      flash: 0,
      deadT: 0,
    },
    {
      id: "veilfly",
      kind: "veilfly",
      x: 640,
      y: 210,
      w: 34,
      h: 26,
      vx: 40,
      vy: 0,
      facing: 1,
      hp: 2,
      maxHp: 2,
      alive: true,
      state: "idle",
      stateT: 0,
      animT: 0,
      patrolL: 530,
      patrolR: 810,
      homeY: 210,
      atkCd: 0.8,
      flash: 0,
      deadT: 0,
    },
    {
      id: "sentinel",
      kind: "sentinel",
      x: 1080,
      y: GROUND - 60,
      w: 26,
      h: 58,
      vx: 24,
      vy: 0,
      facing: -1,
      hp: 5,
      maxHp: 5,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 840,
      patrolR: 1380,
      homeY: GROUND - 60,
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
