/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.NOMP_API_TARGET || "http://127.0.0.1:20000";
  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target,
          changeOrigin: false,
        },
        "/admin-api": {
          target,
          changeOrigin: false,
        },
      },
    },
    build: { chunkSizeWarningLimit: 1100 },
    // Browser end-to-end tests (e2e/) run under Playwright, not Vitest.
    test: { exclude: [...configDefaults.exclude, "e2e/**"] },
  };
});
