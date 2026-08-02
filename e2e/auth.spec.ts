import { expect, test } from "@playwright/test";
import { installDefaultApiMocks } from "./mock-api";

test("local development credentials remain session scoped", async ({ page }) => {
  await installDefaultApiMocks(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Connect to LedgerGuard" })).toBeVisible();
  await page.getByLabel("Backend API key").fill("temporary-api-key");
  await page.getByRole("button", { name: "Start secure session" }).click();
  await expect(page.getByRole("heading", { name: "Good morning, operator" })).toBeVisible();
  const storage = await page.evaluate(() => ({
    session: sessionStorage.getItem("ledgerguard.apiKey"),
    local: localStorage.getItem("ledgerguard.apiKey"),
  }));
  expect(storage).toEqual({ session: "temporary-api-key", local: null });
});
