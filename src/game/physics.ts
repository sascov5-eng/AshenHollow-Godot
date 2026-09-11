import type { Rect, Solid } from "./types";
import { overlaps } from "./world";

const SKIN = 0.1;
const MAX_STEP = 10;

export function moveResolve(
  body: Rect & { vx: number; vy: number; grounded?: boolean; wallL?: boolean; wallR?: boolean },
  dt: number,
  solids: Solid[],
  drop = false,
) {
  body.grounded = false;
  body.wallL = false;
  body.wallR = false;

  const dx = body.vx * dt;
  const dy = body.vy * dt;
  const stepsX = Math.max(1, Math.ceil(Math.abs(dx) / MAX_STEP));
  const sx = dx / stepsX;
  for (let i = 0; i < stepsX; i++) {
    body.x += sx;
    resolveX(body, solids);
  }
  const stepsY = Math.max(1, Math.ceil(Math.abs(dy) / MAX_STEP));
  const sy = dy / stepsY;
  for (let i = 0; i < stepsY; i++) {
    body.y += sy;
    resolveY(body, solids, drop, sy);
  }
}

function resolveX(body: Rect & { vx: number; wallL?: boolean; wallR?: boolean }, solids: Solid[]) {
  for (const s of solids) {
    if (s.oneWay || s.spike) continue;
    if (!overlaps(body.x, body.y, body.w, body.h, s)) continue;
    if (body.vx > 0) {
      body.x = s.x - body.w - SKIN;
      body.vx = 0;
      body.wallR = true;
    } else if (body.vx < 0) {
      body.x = s.x + s.w + SKIN;
      body.vx = 0;
      body.wallL = true;
    }
  }
}

function resolveY(
  body: Rect & { vy: number; grounded?: boolean },
  solids: Solid[],
  drop: boolean,
  step: number,
) {
  for (const s of solids) {
    if (s.spike) continue;
    if (!overlaps(body.x, body.y, body.w, body.h, s)) continue;
    if (s.oneWay) {
      if (drop || step < 0) continue;
      const prevBottom = body.y + body.h - step;
      if (prevBottom > s.y + 6) continue;
      body.y = s.y - body.h - SKIN;
      body.vy = 0;
      body.grounded = true;
      continue;
    }
    if (step > 0 || body.vy >= 0) {
      const prevBottom = body.y + body.h - step;
      if (prevBottom <= s.y + 12 || body.y + body.h - s.y < s.y + s.h - body.y) {
        if (body.y + body.h - s.y <= s.h * 0.5 + 8) {
          body.y = s.y - body.h - SKIN;
          body.vy = 0;
          body.grounded = true;
          continue;
        }
      }
    }
    if (step < 0 || body.vy < 0) {
      body.y = s.y + s.h + SKIN;
      body.vy = 0;
    } else {
      body.y = s.y - body.h - SKIN;
      body.vy = 0;
      body.grounded = true;
    }
  }
}

export function hitSpike(body: Rect, solids: Solid[]) {
  for (const s of solids) {
    if (!s.spike) continue;
    if (overlaps(body.x, body.y + body.h * 0.4, body.w, body.h * 0.6, s)) return true;
  }
  return false;
}
