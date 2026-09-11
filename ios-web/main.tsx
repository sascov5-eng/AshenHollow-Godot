import { createRoot } from "react-dom/client";
import { PaleHallApp } from "@/components/game/PaleHallApp";
import { SAVE_KEY } from "@/game/constants";
import "../src/styles.css";

function boot() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    if (parsed.touch !== "off") {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...parsed, touch: "on" }));
    }
  } catch {
    /* ignore */
  }

  const root = document.getElementById("app");
  if (!root) throw new Error("missing #app");
  createRoot(root).render(<PaleHallApp />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
