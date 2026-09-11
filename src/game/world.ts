import { GROUND, WORLD_H, WORLD_W } from "./constants";
import type { Enemy, PropDraw, Rect, Solid } from "./types";

export const SPAWN = { x: 150, y: GROUND - 50 };
export const BENCH = { x: 70, y: GROUND - 58, w: 86, h: 58 };
export const DOOR = { x: 1960, y: GROUND - 188, w: 100, h: 188 };

const PLATS: Array<[number, number, number]> = [
  [240, 468, 170],
  [450, 398, 150],
  [640, 338, 140],
  [820, 388, 210],
  [1088, 318, 150],
  [1280, 258, 130],
  [1548, 218, 180],
  [1760, 298, 170],
  [1948, 398, 120],
];

export function makeSolids(): Solid[] {
  const pitL = 720;
  const pitR = 1048;
  const solids: Solid[] = [
    { x: 0, y: 0, w: 36, h: GROUND, kind: "wall" },
    { x: WORLD_W - 36, y: 0, w: 36, h: GROUND, kind: "wall" },
    { x: 0, y: 0, w: WORLD_W, h: 28, kind: "ceiling" },
    { x: 36, y: GROUND, w: pitL - 36, h: WORLD_H - GROUND, kind: "ground" },
    { x: pitR, y: GROUND, w: WORLD_W - 36 - pitR, h: WORLD_H - GROUND, kind: "ground" },
    { x: pitL, y: GROUND + 28, w: pitR - pitL, h: 44, kind: "spike", spike: true },
    { x: 1410, y: 196, w: 26, h: GROUND - 196, kind: "wall" },
    { x: 1504, y: 196, w: 26, h: GROUND - 196, kind: "wall" },
  ];
  for (const [x, y, w] of PLATS) {
    solids.push({ x, y, w, h: 22, kind: "plat", oneWay: true });
  }
  return solids;
}

export function makeProps(): PropDraw[] {
  const props: PropDraw[] = [
    { img: "bench", x: BENCH.x, y: BENCH.y, w: BENCH.w, h: BENCH.h, z: 2 },
    { img: "door", x: DOOR.x, y: DOOR.y, w: DOOR.w, h: DOOR.h, z: 1 },
    { img: "spikes", x: 728, y: GROUND - 8, w: 312, h: 52, z: 3 },
    { img: "lantern", x: 48, y: 390, w: 36, h: 58, z: 2 },
    { img: "lantern", x: 690, y: 278, w: 34, h: 54, z: 2 },
    { img: "lantern", x: 1420, y: 148, w: 32, h: 52, z: 2 },
    { img: "lantern", x: 1888, y: 330, w: 34, h: 54, z: 2 },
    { img: "crystal", x: 300, y: 418, w: 40, h: 50, z: 2 },
    { img: "crystal", x: 1310, y: 210, w: 38, h: 48, z: 2 },
    { img: "crystal", x: 1580, y: 172, w: 36, h: 46, z: 2 },
    { img: "bones", x: 400, y: GROUND - 40, w: 70, h: 42, z: 2 },
    { img: "bones", x: 1188, y: GROUND - 38, w: 64, h: 40, z: 2 },
    { img: "bones", x: 1700, y: GROUND - 38, w: 68, h: 40, z: 2 },
    { img: "moss", x: 100, y: GROUND - 36, w: 80, h: 40, z: 3 },
    { img: "moss", x: 560, y: GROUND - 34, w: 70, h: 36, z: 3 },
    { img: "moss", x: 1120, y: GROUND - 34, w: 76, h: 38, z: 3 },
    { img: "moss", x: 1620, y: GROUND - 34, w: 72, h: 36, z: 3 },
  ];
  for (const [x, y, w] of PLATS) {
    props.push({ img: "platform", x: x - 4, y: y - 8, w: w + 8, h: 34, z: 1 });
    props.push({ img: "moss", x: x + 12, y: y - 28, w: Math.min(70, w - 20), h: 32, z: 3 });
  }
  return props;
}

export function makeEnemies(): Enemy[] {
  return [
    {
      id: "gloommite",
      kind: "gloommite",
      x: 480,
      y: GROUND - 32,
      w: 48,
      h: 30,
      vx: 48,
      vy: 0,
      facing: 1,
      hp: 3,
      maxHp: 3,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 80,
      patrolR: 680,
      homeY: GROUND - 32,
      atkCd: 0,
      flash: 0,
      deadT: 0,
    },
    {
      id: "veilfly",
      kind: "veilfly",
      x: 900,
      y: 300,
      w: 38,
      h: 30,
      vx: 36,
      vy: 0,
      facing: 1,
      hp: 2,
      maxHp: 2,
      alive: true,
      state: "idle",
      stateT: 0,
      animT: 0,
      patrolL: 760,
      patrolR: 1220,
      homeY: 300,
      atkCd: 1,
      flash: 0,
      deadT: 0,
    },
    {
      id: "sentinel",
      kind: "sentinel",
      x: 1680,
      y: GROUND - 66,
      w: 28,
      h: 62,
      vx: 28,
      vy: 0,
      facing: -1,
      hp: 5,
      maxHp: 5,
      alive: true,
      state: "walk",
      stateT: 0,
      animT: 0,
      patrolL: 1088,
      patrolR: 1920,
      homeY: GROUND - 66,
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
