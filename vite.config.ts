import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { powerApps } from "@microsoft/power-apps-vite/plugin"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), powerApps()],
  build: {
    assetsInlineLimit: 12000, // inline assets < 12KB as base64 data URLs
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
});
