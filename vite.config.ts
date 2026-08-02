import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/**
 * Vite provides the React Fast Refresh pipeline and a deterministic same-origin
 * development proxy. Production traffic is handled by the nginx BFF boundary.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET ?? "http://localhost:8080";

  return {
    plugins: [...react()],
    server: {
      host: "0.0.0.0",
      port: 4200,
      strictPort: true,
      proxy: {
        "/api": { target: proxyTarget, changeOrigin: true },
        "/actuator": { target: proxyTarget, changeOrigin: true },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4300,
      strictPort: true,
    },
    build: {
      target: "baseline-widely-available",
      manifest: true,
      sourcemap: false,
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          // Rolldown/Vite 8 expects a function rather than the legacy object form.
          manualChunks(moduleId) {
            if (!moduleId.includes("node_modules")) return undefined;
            if (/node_modules\/(react|react-dom|react-router)\//.test(moduleId)) return "react";
            if (moduleId.includes("@tanstack/react-query")) return "query";
            if (/node_modules\/(react-hook-form|zod|@hookform)\//.test(moduleId)) return "forms";
            if (moduleId.includes("recharts")) return "charts";
            return "vendor";
          },
        },
      },
    },
  };
});
