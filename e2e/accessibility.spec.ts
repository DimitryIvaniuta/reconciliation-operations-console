import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  installDefaultApiMocks,
  replayJobId,
  reportId,
  startAuthenticatedSession,
} from "./mock-api";

const criticalRoutes = ["/", `/reports/${reportId}`, `/replays/${replayJobId}`, "/replays"];

test.describe("critical workflow accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await startAuthenticatedSession(page);
    await installDefaultApiMocks(page);
  });

  for (const route of criticalRoutes) {
    test(`${route} has no serious or critical WCAG violations`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name.includes("mobile"),
        "The desktop scan covers semantic output",
      );
      await page.goto(route);
      await page.getByRole("main").waitFor();
      const results = await new AxeBuilder({ page })
        .include("main")
        .exclude(".recharts-wrapper")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const blocking = results.violations.filter(
        ({ impact }) => impact === "serious" || impact === "critical",
      );
      expect(blocking).toEqual([]);
    });
  }
});
