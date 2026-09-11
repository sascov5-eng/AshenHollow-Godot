export type Mode = "title" | "playing" | "paused" | "settings" | "dead" | "win" | "loading";

export type Quality = "low" | "high";

export type Settings = {
  master: number;
  music: number;
  sfx: number;
  shake: number;
  quality: Quality;
  touch: "auto" | "on" | "off";
};

export type Actions = {
  moveX: number;
  moveY: number;
  jump: boolean;
  jumpPressed: boolean;
  attack: boolean;
  attackPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
  heal: boolean;
  down: boolean;
  pausePressed: boolean;
};

export type Rect = { x: number; y: number; w: number; h: number };

export type Solid = Rect & {
  oneWay?: boolean;
  spike?: boolean;
  kind: "ground" | "wall" | "plat" | "spike" | "ceiling";
};

export type PropDraw = {
  img: "lantern" | "moss" | "crystal" | "bones" | "bench" | "door" | "spikes" | "platform";
  x: number;
  y: number;
  w: number;
  h: number;
  flip?: boolean;
  z?: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
  kind: "dust" | "spark" | "soul" | "mote" | "heal";
};

export type FxBurst = {
  x: number;
  y: number;
  t: number;
  max: number;
  sheet: "slash" | "impact" | "heal";
  flip: boolean;
  scale: number;
};

export type EnemyKind = "gloommite" | "veilfly" | "sentinel";

export type Enemy = {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  alive: boolean;
  state: "idle" | "walk" | "attack" | "hurt" | "dead";
  stateT: number;
  animT: number;
  patrolL: number;
  patrolR: number;
  homeY: number;
  atkCd: number;
  flash: number;
  deadT: number;
};

export type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  soul: number;
  grounded: boolean;
  wasGrounded: boolean;
  wallL: boolean;
  wallR: boolean;
  coyote: number;
  jumpBuf: number;
  wallCoyote: number;
  wallDir: 0 | -1 | 1;
  dashT: number;
  dashCd: number;
  dashVx: number;
  dashVy: number;
  atkT: number;
  atkHit: boolean;
  healT: number;
  healing: boolean;
  hurtT: number;
  deadT: number;
  dropT: number;
  anim: "idle" | "run" | "jump" | "dash" | "attack" | "heal" | "wall" | "hurt";
  animT: number;
  squish: number;
  sitting: boolean;
};

export type UiSnap = {
  mode: Mode;
  hp: number;
  maxHp: number;
  soul: number;
  maxSoul: number;
  dashReady: boolean;
  killed: number;
  total: number;
  hint: string;
  doorOpen: boolean;
  loading: number;
  settings: Settings;
  showTouch: boolean;
};
