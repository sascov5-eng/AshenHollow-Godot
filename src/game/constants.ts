export const VIEW_W = 1280;
export const VIEW_H = 720;
export const STEP = 1 / 60;
export const MAX_FRAME = 0.1;
export const WORLD_W = 3600;
export const WORLD_H = 1100;
export const GROUND = 900;

export const PLAYER = {
  w: 20,
  h: 36,
  accel: 2600,
  airAccel: 1700,
  maxSpeed: 235,
  friction: 2200,
  jumpVel: -470,
  jumpCut: 0.48,
  coyote: 0.1,
  buffer: 0.12,
  gravUp: 1280,
  gravDown: 2450,
  gravApex: 720,
  apex: 55,
  maxFall: 640,
  dashSpeed: 560,
  dashTime: 0.17,
  dashCooldown: 0.44,
  wallSlide: 88,
  wallJumpX: 300,
  wallJumpY: -410,
  wallCoyote: 0.1,
  attackTime: 0.3,
  attackHit0: 0.07,
  attackHit1: 0.16,
  healTime: 0.9,
  healCost: 33,
  maxHp: 5,
  maxSoul: 99,
  soulHit: 11,
  iFrames: 0.95,
  knock: 220,
};

export const SAVE_KEY = "pale-hall-beta-v1";
