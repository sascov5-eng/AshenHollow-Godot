import { SAVE_KEY } from "./constants";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.55,
  sfx: 0.85,
  shake: 0.7,
  quality: "high",
  touch: "auto",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
