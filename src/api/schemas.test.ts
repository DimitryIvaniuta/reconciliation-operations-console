import { dailyMetricsSchema, parseContract, reconciliationReportSchema } from "./schemas";

describe("backend contract validation", () => {
  it("accepts an exact daily metrics payload", () => {
    expect(
      parseContract(dailyMetricsSchema, {
        businessDate: "2026-07-18",
        consumedEventCount: 4,
        uniqueEventCount: 4,
        databaseRecordCount: 4,
        aggregateRecordCount: 4,
        databaseAmount: 40,
        aggregateAmount: 40,
        updatedAt: "2026-07-19T08:00:00Z",
      }).businessDate,
    ).toBe("2026-07-18");
  });

  it("rejects malformed backend evidence with a safe contract error", () => {
    expect(() => parseContract(reconciliationReportSchema, { status: "MATCHED" })).toThrow(
      "The backend response did not match the expected API contract.",
    );
  });
  it("rejects reconciliation evidence whose partition ranges do not equal the Kafka total", () => {
    const malformed = {
      reportId: "11111111-1111-4111-8111-111111111111",
      businessDate: "2026-07-18",
      triggerType: "MANUAL",
      status: "MISMATCH",
      kafkaEventCount: 2,
      consumedEventCount: 1,
      uniqueEventCount: 1,
      databaseRecordCount: 1,
      aggregateRecordCount: 1,
      databaseAmount: 10,
      aggregateAmount: 10,
      sourceOffsets: [{ partition: 0, startOffset: 10, endOffset: 11 }],
      issues: [
        {
          type: "KAFKA_VS_SOURCE_OBSERVATIONS",
          expected: "2",
          actual: "1",
          delta: "-1",
          action: "Run a bounded replay.",
        },
      ],
      correlationId: "corr-contract",
      createdAt: "2026-07-19T08:00:00Z",
    };

    expect(() => parseContract(reconciliationReportSchema, malformed)).toThrow(
      "The backend response did not match the expected API contract.",
    );
  });

  it("rejects a mismatch report without an actionable issue", () => {
    const malformed = {
      reportId: "11111111-1111-4111-8111-111111111111",
      businessDate: "2026-07-18",
      triggerType: "MANUAL",
      status: "MISMATCH",
      kafkaEventCount: 1,
      consumedEventCount: 1,
      uniqueEventCount: 1,
      databaseRecordCount: 1,
      aggregateRecordCount: 1,
      databaseAmount: 10,
      aggregateAmount: 10,
      sourceOffsets: [{ partition: 0, startOffset: 10, endOffset: 11 }],
      issues: [],
      correlationId: "corr-contract",
      createdAt: "2026-07-19T08:00:00Z",
    };

    expect(() => parseContract(reconciliationReportSchema, malformed)).toThrow(
      "The backend response did not match the expected API contract.",
    );
  });
});
