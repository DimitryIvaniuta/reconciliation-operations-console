import { expect, test } from "@playwright/test";
import { installDefaultApiMocks, startAuthenticatedSession } from "./mock-api";

test("operator publishes a validated event with required security headers", async ({ page }) => {
  await startAuthenticatedSession(page);
  await installDefaultApiMocks(page);
  let captured: { headers: Record<string, string>; body: Record<string, unknown> } | null = null;
  await page.route("**/api/v1/events", async (route) => {
    const request = route.request();
    captured = {
      headers: request.headers(),
      body: request.postDataJSON() as Record<string, unknown>,
    };
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify(captured.body),
    });
  });
  await page.goto("/events");
  await page.getByLabel("Business key").fill("ORDER-E2E-42");
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(page.getByText("Event accepted for Kafka publication")).toBeVisible();
  expect(captured?.headers["x-api-key"]).toBe("e2e-api-key");
  expect(captured?.headers["x-correlation-id"]).toMatch(/[0-9a-f-]{36}/);
  expect(captured?.body.businessKey).toBe("ORDER-E2E-42");
});

test("malformed attributes are blocked before a network request", async ({ page }) => {
  await startAuthenticatedSession(page);
  await installDefaultApiMocks(page);
  let requestCount = 0;
  await page.route("**/api/v1/events", async (route) => {
    requestCount += 1;
    await route.abort();
  });
  await page.goto("/events");
  await page.getByLabel("Attributes JSON").fill("<script>alert(1)</script>");
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(page.getByText("Attributes must be a valid JSON object")).toBeVisible();
  expect(requestCount).toBe(0);
});
