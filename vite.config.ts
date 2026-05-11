import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vite serves the preview UI from web/ on port 5173 and proxies API requests
 * to the Express render server. The Remotion composition and its layers live
 * in src/ and are imported directly by web/App.tsx for the in-browser preview.
 */
export default defineConfig({
  root: path.resolve(__dirname, "web"),
  publicDir: false,
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist-web"),
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
    },
  },
});
