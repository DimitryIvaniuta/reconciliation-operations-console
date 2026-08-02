import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI && !executablePath ? 2 : 0,
  workers: 2,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4300",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: executablePath ? "off" : "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath, args: ["--no-sandbox"] } } : {}),
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4300",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
