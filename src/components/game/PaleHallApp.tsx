import { useEffect, useRef, useState } from "react";
import { PaleHallGame } from "@/game/engine";
import { DEFAULT_SETTINGS } from "@/game/save";
import type { Settings, UiSnap } from "@/game/types";
import { TouchControls } from "./TouchControls";

const idle: UiSnap = {
  mode: "loading",
  hp: 5,
  maxHp: 5,
  soul: 0,
  maxSoul: 99,
  dashReady: true,
  killed: 0,
  total: 3,
  hint: "",
  doorOpen: false,
  loading: 0,
  settings: DEFAULT_SETTINGS,
  showTouch: false,
};

export function PaleHallApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PaleHallGame | null>(null);
  const [ui, setUi] = useState<UiSnap>(idle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new PaleHallGame(canvas, setUi);
    gameRef.current = game;
    void game.boot();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const g = gameRef.current;
  const overlay = ui.mode !== "playing";
  const start = () => gameRef.current?.tapStart();

  return (
    <div className="landscape-shell text-fg">
      <canvas
        ref={canvasRef}
        className="ph-canvas"
        onPointerDown={() => {
          if (ui.mode === "title" || ui.mode === "dead" || ui.mode === "win") start();
        }}
      />
      {ui.mode === "playing" || ui.mode === "paused" ? <Hud ui={ui} /> : null}
      <TouchControls game={g} visible={ui.showTouch && ui.mode === "playing"} />
      {overlay ? (
        <Menu
          ui={ui}
          onPlay={start}
          onResume={() => gameRef.current?.pauseToggle()}
          onRetry={start}
          onTitle={() => gameRef.current?.goTitle()}
          onSettings={(p) => gameRef.current?.patchSettings(p)}
          onPause={() => gameRef.current?.pauseToggle()}
        />
      ) : (
        <button
          type="button"
          className="absolute top-[max(12px,env(safe-area-inset-top))] right-[max(12px,env(safe-area-inset-right))] z-30 rounded-full border border-border bg-surface/80 px-3 py-2 text-xs tracking-wide text-muted"
          onPointerDown={() => gameRef.current?.pauseToggle()}
        >
          Пауза
        </button>
      )}
    </div>
  );
}

function Hud({ ui }: { ui: UiSnap }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-[max(12px,env(safe-area-inset-top))] pr-24">
      <div className="flex items-start gap-6">
        <div>
          <div className="flex gap-1.5">
            {Array.from({ length: ui.maxHp }).map((_, i) => (
              <span
                key={i}
                className="block size-3.5 rotate-45 border border-mask"
                style={{
                  background: i < ui.hp ? "var(--color-mask)" : "transparent",
                  opacity: i < ui.hp ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <div className="mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-soul"
              style={{ width: `${(ui.soul / ui.maxSoul) * 100}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">душа {ui.soul}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">камера 01</p>
          <p className="mt-1 text-sm text-fg">
            {ui.killed}/{ui.total} повержены
          </p>
          <p className="mt-1 font-mono text-[10px] text-soul">{ui.dashReady ? "рывок готов" : "рывок…"}</p>
        </div>
      </div>
      <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">{ui.hint}</p>
    </div>
  );
}

function Menu({
  ui,
  onPlay,
  onResume,
  onRetry,
  onTitle,
  onSettings,
}: {
  ui: UiSnap;
  onPlay: () => void;
  onResume: () => void;
  onRetry: () => void;
  onTitle: () => void;
  onSettings: (p: Partial<Settings>) => void;
  onPause: () => void;
}) {
  const [panel, setPanel] = useState<"root" | "settings" | "controls">(
    ui.mode === "settings" ? "settings" : "root",
  );

  useEffect(() => {
    if (ui.mode === "title") setPanel("root");
  }, [ui.mode]);

  return (
    <div className="ph-menu">
      {ui.mode === "loading" ? (
        <div className="ph-dock">
          <div>
            <p>closed beta 0.9</p>
            <h1>Pale Hall</h1>
          </div>
          <button type="button" className="ph-start" disabled>
            Сборка…
          </button>
        </div>
      ) : null}

      {ui.mode === "title" && panel === "root" ? (
        <div className="ph-dock">
          <div>
            <p>closed beta 0.9</p>
            <h1>Pale Hall</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ph-ghost" onPointerDown={() => setPanel("settings")}>
              Настройки
            </button>
            <button type="button" className="ph-start" onPointerDown={onPlay}>
              Начать
            </button>
          </div>
        </div>
      ) : null}

      {ui.mode === "paused" && panel === "root" ? (
        <div className="ph-card">
          <h2>Пауза</h2>
          <div className="ph-actions">
            <button type="button" className="ph-start" onPointerDown={onResume}>
              Продолжить
            </button>
            <button type="button" className="ph-ghost" onPointerDown={() => setPanel("settings")}>
              Настройки
            </button>
            <button type="button" className="ph-ghost" onPointerDown={onTitle}>
              В титул
            </button>
          </div>
        </div>
      ) : null}

      {ui.mode === "dead" ? (
        <div className="ph-card">
          <h2>Тьма забрала вас</h2>
          <p className="mt-2 text-sm text-muted">Возрождение у скамьи. Зал начинается заново.</p>
          <div className="ph-actions">
            <button type="button" className="ph-start" onPointerDown={onRetry}>
              Вернуться к скамье
            </button>
          </div>
        </div>
      ) : null}

      {ui.mode === "win" ? (
        <div className="ph-card">
          <h2>Зал затих</h2>
          <p className="mt-2 text-sm text-muted">Тестовая комната пройдена. Спасибо за сессию бета-теста.</p>
          <div className="ph-actions">
            <button type="button" className="ph-start" onPointerDown={onRetry}>
              Ещё раз
            </button>
          </div>
        </div>
      ) : null}

      {panel === "settings" ? (
        <SettingsPanel
          settings={ui.settings}
          onChange={onSettings}
          onBack={() => setPanel("root")}
        />
      ) : null}

      {panel === "controls" ? (
        <div className="ph-card">
          <h2>Управление</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Нажмите по залу или кнопку «Начать».</li>
            <li>Стик — шаг. Справа — прыжок, удар, рывок, лечение.</li>
            <li>Стены — скольжение и прыжок в сторону.</li>
          </ul>
          <button type="button" className="ph-ghost mt-5" onPointerDown={() => setPanel("root")}>
            Назад
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onBack,
}: {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onBack: () => void;
}) {
  const row = "flex items-center justify-between gap-4 text-sm";
  return (
    <div className="ph-card">
      <h2>Настройки</h2>
      <div className="mt-5 space-y-4">
        <label className={row}>
          Громкость
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.master}
            onChange={(e) => onChange({ master: Number(e.target.value) })}
            className="w-36 accent-soul"
          />
        </label>
        <label className={row}>
          Музыка
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.music}
            onChange={(e) => onChange({ music: Number(e.target.value) })}
            className="w-36 accent-soul"
          />
        </label>
        <label className={row}>
          Эффекты
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.sfx}
            onChange={(e) => onChange({ sfx: Number(e.target.value) })}
            className="w-36 accent-soul"
          />
        </label>
        <label className={row}>
          Тряска
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.shake}
            onChange={(e) => onChange({ shake: Number(e.target.value) })}
            className="w-36 accent-soul"
          />
        </label>
        <label className={row}>
          Графика
          <select
            value={settings.quality}
            onChange={(e) => onChange({ quality: e.target.value as Settings["quality"] })}
            className="rounded-md border border-border bg-surface-2 px-2 py-1"
          >
            <option value="high">Высокая</option>
            <option value="low">Низкая</option>
          </select>
        </label>
        <label className={row}>
          Сенсор
          <select
            value={settings.touch}
            onChange={(e) => onChange({ touch: e.target.value as Settings["touch"] })}
            className="rounded-md border border-border bg-surface-2 px-2 py-1"
          >
            <option value="auto">Авто</option>
            <option value="on">Всегда</option>
            <option value="off">Выкл</option>
          </select>
        </label>
      </div>
      <button type="button" className="ph-ghost mt-6 w-full" onPointerDown={onBack}>
        Назад
      </button>
    </div>
  );
}
