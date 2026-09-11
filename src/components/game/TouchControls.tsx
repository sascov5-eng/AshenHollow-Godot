import { useCallback, useRef } from "react";
import type { PaleHallGame } from "@/game/engine";

type Props = { game: PaleHallGame | null; visible: boolean };

function hold(
  game: PaleHallGame | null,
  field: "touchJump" | "touchAttack" | "touchDash" | "touchHeal" | "touchDown",
  on: boolean,
) {
  if (!game) return;
  game.input[field] = on;
}

export function TouchControls({ game, visible }: Props) {
  const stick = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const onStick = useCallback(
    (e: React.PointerEvent) => {
      if (!game || !stick.current) return;
      if (pid.current !== null && e.pointerId !== pid.current) return;
      const r = stick.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let x = (e.clientX - cx) / (r.width * 0.42);
      let y = (e.clientY - cy) / (r.height * 0.42);
      const m = Math.hypot(x, y);
      if (m > 1) {
        x /= m;
        y /= m;
      }
      game.input.touchMoveX = x;
      game.input.touchMoveY = y;
      game.input.touchDown = y > 0.55;
    },
    [game],
  );

  const endStick = useCallback(
    (e: React.PointerEvent) => {
      if (pid.current !== null && e.pointerId !== pid.current) return;
      pid.current = null;
      if (!game) return;
      game.input.touchMoveX = 0;
      game.input.touchMoveY = 0;
      game.input.touchDown = false;
    },
    [game],
  );

  if (!visible) return null;

  const btn =
    "pointer-events-auto flex size-14 items-center justify-center rounded-full border border-border bg-surface/80 text-[11px] font-medium uppercase tracking-wide text-fg backdrop-blur-sm active:scale-95 sm:size-16";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      <div
        ref={stick}
        className="pointer-events-auto absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(12px,env(safe-area-inset-left))] size-32 rounded-full border border-border bg-surface/50 backdrop-blur-sm sm:size-36"
        onPointerDown={(e) => {
          pid.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          onStick(e);
        }}
        onPointerMove={onStick}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
        <span className="absolute inset-0 m-auto size-10 rounded-full bg-accent/20" />
      </div>
      <div className="absolute right-[max(12px,env(safe-area-inset-right))] bottom-[max(18px,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2">
        <button
          type="button"
          className={btn}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            hold(game, "touchHeal", true);
          }}
          onPointerUp={() => hold(game, "touchHeal", false)}
          onPointerCancel={() => hold(game, "touchHeal", false)}
        >
          Лечить
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            hold(game, "touchDash", true);
          }}
          onPointerUp={() => hold(game, "touchDash", false)}
          onPointerCancel={() => hold(game, "touchDash", false)}
        >
          Рывок
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            hold(game, "touchAttack", true);
          }}
          onPointerUp={() => hold(game, "touchAttack", false)}
          onPointerCancel={() => hold(game, "touchAttack", false)}
        >
          Удар
        </button>
        <button
          type="button"
          className={`${btn} bg-accent text-accent-fg`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            hold(game, "touchJump", true);
          }}
          onPointerUp={() => hold(game, "touchJump", false)}
          onPointerCancel={() => hold(game, "touchJump", false)}
        >
          Прыжок
        </button>
      </div>
    </div>
  );
}
