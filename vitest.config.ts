import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      // Unit coverage is enforced on security, transport, contract and state logic.
      // Page composition and responsive navigation are exercised by Playwright.
      include: [
        "src/api/http-client.ts",
        "src/api/reconciliation-api.ts",
        "src/api/schemas.ts",
        "src/auth/session.ts",
        "src/config/runtime-config.ts",
        "src/hooks/use-recent-replays.ts",
        "src/utils/*.ts",
      ],
      exclude: ["src/test/**", "src/**/*.d.ts"],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      },
    },
  },
});
