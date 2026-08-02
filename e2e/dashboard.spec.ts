import { expect, test } from "@playwright/test";
import { installDefaultApiMocks, startAuthenticatedSession } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await startAuthenticatedSession(page);
  await installDefaultApiMocks(page);
});

test("dashboard presents banking-style operational position", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Good morning, operator" })).toBeVisible();
  await expect(page.getByText("Backend UP")).toBeVisible();
  await expect(page.getByText("Kafka observations")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("MISMATCH");
  await page.getByRole("link", { name: /Open report/ }).click();
  await expect(page.getByRole("heading", { name: /Report for/ })).toBeVisible();
  await expect(page.getByText("Actionable mismatch analysis")).toBeVisible();
});

test("mobile layout exposes an accessible navigation drawer", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only assertion");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Daily metrics" }).click();
  await expect(page.getByRole("heading", { name: "Daily metrics" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
