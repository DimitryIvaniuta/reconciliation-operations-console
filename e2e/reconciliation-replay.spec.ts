import { expect, test } from "@playwright/test";
import {
  installDefaultApiMocks,
  replayJob,
  replayJobId,
  report,
  startAuthenticatedSession,
} from "./mock-api";

test.beforeEach(async ({ page }) => {
  await startAuthenticatedSession(page);
  await installDefaultApiMocks(page);
});

test("manual reconciliation returns an actionable immutable report", async ({ page }) => {
  await page.route("**/api/v1/reconciliations/*/runs", (route) =>
    route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(report) }),
  );
  await page.goto("/reconciliations");
  await page.getByRole("button", { name: "Run reconciliation" }).click();
  await expect(page.getByText("Report created")).toBeVisible();
  await expect(page.getByText("MISMATCH")).toBeVisible();
  await page.getByRole("link", { name: "Open report" }).click();
  await expect(page.getByText("Kafka records vs consumed observations")).toBeVisible();
});

test("dry-run replay submits idempotency metadata and displays checkpoints", async ({ page }) => {
  let idempotency = "";
  let requestedBy = "";
  await page.route("**/api/v1/replays", async (route) => {
    idempotency = route.request().headers()["idempotency-key"] ?? "";
    requestedBy = route.request().headers()["x-requested-by"] ?? "";
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify(replayJob),
    });
  });
  await page.goto("/replays");
  await page.getByLabel("Requested by").fill("e2e-operator");
  await page.getByLabel("Idempotency key").fill("e2e-idempotency-key");
  await page.getByRole("button", { name: "Request replay" }).click();
  await expect(page).toHaveURL(new RegExp(`/replays/${replayJobId}$`));
  await expect(page.getByText("Partition checkpoints")).toBeVisible();
  await expect(page.getByText("business-events.v1").first()).toBeVisible();
  expect(idempotency).toBe("e2e-idempotency-key");
  expect(requestedBy).toBe("e2e-operator");
});
