import { requestJson } from "./http-client";
import { type ApiContext, reconciliationApi } from "./reconciliation-api";

vi.mock("./http-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("./http-client")>();
  return { ...original, requestJson: vi.fn() };
});

const context: ApiContext = {
  apiBaseUrl: "/api",
  healthBaseUrl: "/actuator",
  apiKey: "session-secret",
};
const instant = "2026-07-19T09:00:00Z";
const event = {
  eventId: "11111111-1111-4111-8111-111111111111",
  businessKey: "ORDER-1001",
  eventTime: instant,
  amount: 125.5,
  attributes: { channel: "test" },
};
const metrics = {
  businessDate: "2026-07-18",
  consumedEventCount: 10,
  uniqueEventCount: 10,
  databaseRecordCount: 10,
  aggregateRecordCount: 10,
  databaseAmount: 500,
  aggregateAmount: 500,
  updatedAt: instant,
};
const report = {
  reportId: "22222222-2222-4222-8222-222222222222",
  businessDate: "2026-07-18",
  triggerType: "MANUAL",
  status: "MATCHED",
  kafkaEventCount: 10,
  consumedEventCount: 10,
  uniqueEventCount: 10,
  databaseRecordCount: 10,
  aggregateRecordCount: 10,
  databaseAmount: 500,
  aggregateAmount: 500,
  sourceOffsets: [{ partition: 0, startOffset: 5, endOffset: 15 }],
  issues: [],
  correlationId: "corr-1",
  createdAt: instant,
};
const replay = {
  jobId: "33333333-3333-4333-8333-333333333333",
  idempotencyKey: "idem-1",
  fromDate: "2026-07-17",
  toDate: "2026-07-18",
  dryRun: false,
  status: "REQUESTED",
  discoveredEvents: 0,
  replayedEvents: 0,
  attemptCount: 0,
  requestedBy: "operator@example.com",
  correlationId: "corr-2",
  errorMessage: null,
  requestedAt: instant,
  startedAt: null,
  completedAt: null,
  commandPublishedAt: null,
  heartbeatAt: null,
};
const checkpoint = {
  jobId: replay.jobId,
  sourceTopic: "business-events",
  sourcePartition: 0,
  startOffset: 5,
  endOffset: 15,
  nextOffset: 5,
  discoveredEvents: 0,
  replayedEvents: 0,
  status: "PENDING",
  updatedAt: instant,
};

const requestMock = vi.mocked(requestJson);

describe("reconciliationApi", () => {
  beforeEach(() => requestMock.mockReset());

  it("maps health, event, metrics and reconciliation routes to validated contracts", async () => {
    requestMock
      .mockResolvedValueOnce({ status: "UP" })
      .mockResolvedValueOnce(event)
      .mockResolvedValueOnce(metrics)
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce([report]);

    await expect(reconciliationApi.health(context)).resolves.toEqual({ status: "UP" });
    await expect(reconciliationApi.publishEvent(context, event)).resolves.toEqual(event);
    await expect(reconciliationApi.metrics(context, "2026-07-18")).resolves.toEqual(metrics);
    await expect(reconciliationApi.runReconciliation(context, "2026-07-18")).resolves.toEqual(
      report,
    );
    await expect(reconciliationApi.report(context, report.reportId)).resolves.toEqual(report);
    await expect(
      reconciliationApi.reports(context, {
        fromDate: "2026-07-01",
        toDate: "2026-07-18",
        status: "MATCHED",
        page: 1,
        size: 25,
      }),
    ).resolves.toEqual([report]);

    expect(requestMock).toHaveBeenNthCalledWith(1, "/actuator/health", {
      apiKey: "session-secret",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, "/api/v1/events", {
      method: "POST",
      body: event,
      apiKey: "session-secret",
    });
    expect(requestMock).toHaveBeenNthCalledWith(
      6,
      "/api/v1/reconciliations?page=1&size=25&fromDate=2026-07-01&toDate=2026-07-18&status=MATCHED",
      { apiKey: "session-secret" },
    );
  });

  it("maps replay creation, inspection, checkpoint and retry routes", async () => {
    requestMock
      .mockResolvedValueOnce(replay)
      .mockResolvedValueOnce(replay)
      .mockResolvedValueOnce([checkpoint])
      .mockResolvedValueOnce({ ...replay, attemptCount: 1 });

    await expect(
      reconciliationApi.requestReplay(context, {
        fromDate: replay.fromDate,
        toDate: replay.toDate,
        dryRun: false,
        idempotencyKey: replay.idempotencyKey,
        requestedBy: replay.requestedBy,
      }),
    ).resolves.toEqual(replay);
    await expect(reconciliationApi.replay(context, replay.jobId)).resolves.toEqual(replay);
    await expect(reconciliationApi.replayCheckpoints(context, replay.jobId)).resolves.toEqual([
      checkpoint,
    ]);
    await expect(reconciliationApi.retryReplay(context, replay.jobId)).resolves.toMatchObject({
      attemptCount: 1,
    });

    expect(requestMock).toHaveBeenNthCalledWith(1, "/api/v1/replays", {
      method: "POST",
      headers: {
        "Idempotency-Key": replay.idempotencyKey,
        "X-Requested-By": replay.requestedBy,
      },
      body: { fromDate: replay.fromDate, toDate: replay.toDate, dryRun: false },
      apiKey: "session-secret",
    });
    expect(requestMock).toHaveBeenNthCalledWith(3, `/api/v1/replays/${replay.jobId}/checkpoints`, {
      apiKey: "session-secret",
    });
    expect(requestMock).toHaveBeenNthCalledWith(4, `/api/v1/replays/${replay.jobId}/retry`, {
      method: "POST",
      apiKey: "session-secret",
    });
  });

  it("omits empty optional report filters", async () => {
    requestMock.mockResolvedValueOnce([]);
    await reconciliationApi.reports(context, { status: "", page: 0, size: 20 });
    expect(requestMock).toHaveBeenCalledWith("/api/v1/reconciliations?page=0&size=20", {
      apiKey: "session-secret",
    });
  });
});
