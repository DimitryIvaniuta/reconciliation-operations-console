import type { Page, Route } from "@playwright/test";

export const reportId = "11111111-1111-4111-8111-111111111111";
export const replayJobId = "22222222-2222-4222-8222-222222222222";

export const metrics = {
  businessDate: "2026-07-18",
  consumedEventCount: 1200,
  uniqueEventCount: 1198,
  databaseRecordCount: 1198,
  aggregateRecordCount: 1197,
  databaseAmount: 250400.5,
  aggregateAmount: 250200.5,
  updatedAt: "2026-07-19T08:15:00Z",
};

export const report = {
  reportId,
  businessDate: "2026-07-18",
  triggerType: "MANUAL",
  status: "MISMATCH",
  kafkaEventCount: 1200,
  consumedEventCount: 1198,
  uniqueEventCount: 1198,
  databaseRecordCount: 1198,
  aggregateRecordCount: 1197,
  databaseAmount: 250400.5,
  aggregateAmount: 250200.5,
  sourceOffsets: [
    { partition: 0, startOffset: 100, endOffset: 500 },
    { partition: 1, startOffset: 200, endOffset: 600 },
    { partition: 2, startOffset: 300, endOffset: 700 },
  ],
  issues: [
    {
      type: "KAFKA_VS_SOURCE_OBSERVATIONS",
      expected: "1200",
      actual: "1198",
      delta: "-2",
      action: "Request a bounded replay for the missing source positions.",
    },
    {
      type: "DATABASE_VS_AGGREGATE_COUNT",
      expected: "1198",
      actual: "1197",
      delta: "-1",
      action: "Repair and validate the daily aggregate.",
    },
  ],
  correlationId: "corr-e2e-1",
  createdAt: "2026-07-19T08:20:00Z",
};

export const replayJob = {
  jobId: replayJobId,
  idempotencyKey: "e2e-idempotency-key",
  fromDate: "2026-07-18",
  toDate: "2026-07-18",
  dryRun: true,
  status: "RUNNING",
  discoveredEvents: 800,
  replayedEvents: 0,
  attemptCount: 1,
  requestedBy: "e2e-operator",
  correlationId: "corr-e2e-2",
  errorMessage: null,
  requestedAt: "2026-07-19T08:30:00Z",
  startedAt: "2026-07-19T08:31:00Z",
  completedAt: null,
  commandPublishedAt: "2026-07-19T08:30:10Z",
  heartbeatAt: "2026-07-19T08:31:30Z",
};

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "X-Correlation-ID": "e2e-correlation" },
    body: JSON.stringify(body),
  });

/** Installs deterministic backend responses while preserving request validation in each test. */
export async function installDefaultApiMocks(page: Page): Promise<void> {
  await page.route("**/actuator/health", (route) => fulfillJson(route, { status: "UP" }));
  await page.route("**/api/v1/daily-metrics/*", (route) => fulfillJson(route, metrics));
  await page.route("**/api/v1/reconciliations?*", (route) => fulfillJson(route, [report]));
  await page.route(`**/api/v1/reconciliations/${reportId}`, (route) => fulfillJson(route, report));
  await page.route(`**/api/v1/replays/${replayJobId}/checkpoints`, (route) =>
    fulfillJson(route, [
      {
        jobId: replayJobId,
        sourceTopic: "business-events.v1",
        sourcePartition: 0,
        startOffset: 100,
        endOffset: 500,
        nextOffset: 400,
        discoveredEvents: 300,
        replayedEvents: 0,
        status: "RUNNING",
        updatedAt: "2026-07-19T08:31:30Z",
      },
      {
        jobId: replayJobId,
        sourceTopic: "business-events.v1",
        sourcePartition: 1,
        startOffset: 200,
        endOffset: 600,
        nextOffset: 600,
        discoveredEvents: 400,
        replayedEvents: 0,
        status: "COMPLETED",
        updatedAt: "2026-07-19T08:31:20Z",
      },
    ]),
  );
  await page.route(`**/api/v1/replays/${replayJobId}`, (route) => fulfillJson(route, replayJob));
}

export async function startAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript(() => sessionStorage.setItem("ledgerguard.apiKey", "e2e-api-key"));
}
