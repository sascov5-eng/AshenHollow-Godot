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

  return (
    <div className="landscape-shell text-fg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      {ui.mode === "playing" || ui.mode === "paused" ? <Hud ui={ui} /> : null}
      <TouchControls game={g} visible={ui.showTouch && ui.mode === "playing"} />
      {overlay ? (
        <Menu
          ui={ui}
          onPlay={() => g?.begin()}
          onResume={() => g?.pauseToggle()}
          onRetry={() => g?.begin()}
          onTitle={() => gameRef.current?.goTitle()}
          onSettings={(p) => g?.patchSettings(p)}
          onPause={() => g?.pauseToggle()}
        />
      ) : (
        <button
          type="button"
          className="absolute top-[max(12px,env(safe-area-inset-top))] right-[max(12px,env(safe-area-inset-right))] z-30 rounded-full border border-border bg-surface/80 px-3 py-2 text-xs tracking-wide text-muted"
          onClick={() => g?.pauseToggle()}
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

  const card =
    "w-[min(480px,calc(100%-48px))] max-h-[min(92dvh,640px)] overflow-y-auto rounded-xl border border-border bg-surface/92 p-5 shadow-2xl backdrop-blur-md sm:p-6";
  const primary =
    "w-full rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-fg transition-transform duration-150 hover:opacity-90 active:scale-[0.98]";
  const ghost =
    "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm text-fg hover:bg-surface-2";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/55 p-4 backdrop-blur-[2px]">
      {ui.mode === "loading" ? (
        <div className={card}>
          <p className="font-display text-3xl">Pale Hall</p>
          <p className="mt-2 text-sm text-muted">Сборка бета-комнаты…</p>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-soul" style={{ width: `${Math.round(ui.loading * 100)}%` }} />
          </div>
        </div>
      ) : null}

      {ui.mode === "title" && panel === "root" ? (
        <div className={card}>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">closed beta 0.9</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">Pale Hall</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Тестовая комната. Один зал, три стража, платформы, рывок и скольжение по стенам.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" className={primary} onClick={onPlay}>
              Начать испытание
            </button>
            <button type="button" className={ghost} onClick={() => setPanel("settings")}>
              Настройки
            </button>
            <button type="button" className={ghost} onClick={() => setPanel("controls")}>
              Управление
            </button>
          </div>
        </div>
      ) : null}

      {ui.mode === "paused" && panel === "root" ? (
        <div className={card}>
          <h2 className="font-display text-3xl">Пауза</h2>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className={primary} onClick={onResume}>
              Продолжить
            </button>
            <button type="button" className={ghost} onClick={() => setPanel("settings")}>
              Настройки
            </button>
            <button type="button" className={ghost} onClick={onTitle}>
              В титул
            </button>
          </div>
        </div>
      ) : null}

      {ui.mode === "dead" ? (
        <div className={card}>
          <h2 className="font-display text-3xl">Тьма забрала вас</h2>
          <p className="mt-2 text-sm text-muted">Возрождение у скамьи. Зал начинается заново.</p>
          <button type="button" className={`${primary} mt-5`} onClick={onRetry}>
            Вернуться к скамье
          </button>
        </div>
      ) : null}

      {ui.mode === "win" ? (
        <div className={card}>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-soul">печать снята</p>
          <h2 className="mt-2 font-display text-3xl">Зал затих</h2>
          <p className="mt-2 text-sm text-muted">Тестовая комната пройдена. Спасибо за сессию бета-теста.</p>
          <button type="button" className={`${primary} mt-5`} onClick={onRetry}>
            Ещё раз
          </button>
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
        <div className={card}>
          <h2 className="font-display text-3xl">Управление</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>A / D или стик — шаг</li>
            <li>Прыжок — пробел / W / кнопка. Удержание выше.</li>
            <li>Рывок — L / Shift. Восемь направлений со стика.</li>
            <li>Удар — Z / J. Снимает душу с тварей.</li>
            <li>Лечение — удерживать F / I. 33 души, одна маска.</li>
            <li>Стены — скольжение и прыжок в сторону.</li>
            <li>Вниз + прыжок — сойти с платформы.</li>
          </ul>
          <button type="button" className={`${ghost} mt-5`} onClick={() => setPanel("root")}>
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
    <div className="w-[min(480px,calc(100%-48px))] max-h-[min(92dvh,640px)] overflow-y-auto rounded-xl border border-border bg-surface/92 p-5 backdrop-blur-md">
      <h2 className="font-display text-3xl">Настройки</h2>
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
      <button
        type="button"
        className="mt-6 w-full rounded-md border border-border px-4 py-3 text-sm"
        onClick={onBack}
      >
        Назад
      </button>
    </div>
  );
}
