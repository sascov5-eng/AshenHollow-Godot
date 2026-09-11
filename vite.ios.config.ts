import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function iosClassicScripts(): Plugin {
  return {
    name: "ios-classic-scripts",
    transformIndexHtml(html) {
      return html
        .replace(/\s+crossorigin(="[^"]*")?/g, "")
        .replace(/<script type="module"/g, "<script")
        .replace(/<script src=/g, "<script defer src=")
        .replace(/<link rel="modulepreload"[^>]*>/g, "");
    },
  };
}

export default defineConfig({
  root: "ios-web",
  base: "./",
  publicDir: resolve(__dirname, "public"),
  plugins: [react(), tailwindcss(), iosClassicScripts()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  build: {
    outDir: resolve(__dirname, "Resources/www"),
    emptyOutDir: true,
    assetsDir: "assets",
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "PaleHall",
        inlineDynamicImports: true,
        entryFileNames: "assets/game.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
