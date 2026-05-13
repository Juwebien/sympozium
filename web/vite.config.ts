import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const apiPort = process.env.API_LOCAL_PORT || "8081";
const opsclawApiPort = process.env.OPSCLAW_API_LOCAL_PORT || "8082";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    fs: {
      allow: [".", "/opt/homebrew"],
    },
    proxy: {
      "/api": `http://localhost:${apiPort}`,
      "/opsclaw-api": {
        target: `http://localhost:${opsclawApiPort}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opsclaw-api/, ""),
      },
      "/ws": {
        target: `ws://localhost:${apiPort}`,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
