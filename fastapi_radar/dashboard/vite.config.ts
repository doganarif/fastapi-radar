import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/__radar/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Ensure assets are referenced with correct base path
    rollupOptions: {
      output: {
        // Ensure all asset paths are relative to the base
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  server: {
    proxy: {
      "/__radar/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
