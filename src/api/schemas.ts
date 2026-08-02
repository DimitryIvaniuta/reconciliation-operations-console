import { z } from "zod";
import { ApiError } from "./http-client";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoInstant = z.string().datetime({ offset: true });
const nullableInstant = isoInstant.nullable();

export const businessEventSchema = z.object({
  eventId: z.uuid(),
  businessKey: z.string(),
  eventTime: isoInstant,
  amount: z.number().nonnegative(),
  attributes: z.record(z.string(), z.unknown()),
});

export const dailyMetricsSchema = z.object({
  businessDate: isoDate,
  consumedEventCount: z.number().int().nonnegative(),
  uniqueEventCount: z.number().int().nonnegative(),
  databaseRecordCount: z.number().int().nonnegative(),
  aggregateRecordCount: z.number().int().nonnegative(),
  databaseAmount: z.number(),
  aggregateAmount: z.number(),
  updatedAt: isoInstant,
});

const partitionRangeSchema = z
  .object({
    partition: z.number().int().nonnegative(),
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int().nonnegative(),
  })
  .refine((range) => range.endOffset >= range.startOffset, {
    message: "Kafka offset range cannot end before it starts",
  });

const issueSchema = z.object({
  type: z.enum([
    "KAFKA_VS_SOURCE_OBSERVATIONS",
    "SOURCE_OBSERVATIONS_VS_UNIQUE_EVENTS",
    "UNIQUE_EVENTS_VS_DATABASE",
    "DATABASE_VS_AGGREGATE_COUNT",
    "DATABASE_VS_AGGREGATE_AMOUNT",
  ]),
  expected: z.string(),
  actual: z.string(),
  delta: z.string(),
  action: z.string(),
});

export const reconciliationReportSchema = z
  .object({
    reportId: z.uuid(),
    businessDate: isoDate,
    triggerType: z.enum(["SCHEDULED", "MANUAL", "REPLAY_VALIDATION"]),
    status: z.enum(["MATCHED", "MISMATCH"]),
    kafkaEventCount: z.number().int().nonnegative(),
    consumedEventCount: z.number().int().nonnegative(),
    uniqueEventCount: z.number().int().nonnegative(),
    databaseRecordCount: z.number().int().nonnegative(),
    aggregateRecordCount: z.number().int().nonnegative(),
    databaseAmount: z.number(),
    aggregateAmount: z.number(),
    sourceOffsets: z.array(partitionRangeSchema),
    issues: z.array(issueSchema),
    correlationId: z.string().min(1).max(256),
    createdAt: isoInstant,
  })
  .superRefine((report, context) => {
    const offsetCount = report.sourceOffsets.reduce(
      (total, range) => total + range.endOffset - range.startOffset,
      0,
    );
    if (offsetCount !== report.kafkaEventCount) {
      context.addIssue({
        code: "custom",
        path: ["sourceOffsets"],
        message: "Kafka offset evidence does not equal the reported Kafka count",
      });
    }
    if (report.status === "MATCHED" && report.issues.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["issues"],
        message: "Matched reports cannot contain mismatch issues",
      });
    }
    if (report.status === "MISMATCH" && report.issues.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["issues"],
        message: "Mismatch reports must contain at least one actionable issue",
      });
    }
  });

export const replayJobSchema = z.object({
  jobId: z.uuid(),
  idempotencyKey: z.string(),
  fromDate: isoDate,
  toDate: isoDate,
  dryRun: z.boolean(),
  status: z.enum(["REQUESTED", "RUNNING", "COMPLETED", "FAILED"]),
  discoveredEvents: z.number().int().nonnegative(),
  replayedEvents: z.number().int().nonnegative(),
  attemptCount: z.number().int().nonnegative(),
  requestedBy: z.string(),
  correlationId: z.string(),
  errorMessage: z.string().nullable(),
  requestedAt: isoInstant,
  startedAt: nullableInstant,
  completedAt: nullableInstant,
  commandPublishedAt: nullableInstant,
  heartbeatAt: nullableInstant,
});

export const replayCheckpointSchema = z
  .object({
    jobId: z.uuid(),
    sourceTopic: z.string().min(1).max(249),
    sourcePartition: z.number().int().nonnegative(),
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int().nonnegative(),
    nextOffset: z.number().int().nonnegative(),
    discoveredEvents: z.number().int().nonnegative(),
    replayedEvents: z.number().int().nonnegative(),
    status: z.enum(["PENDING", "RUNNING", "COMPLETED"]),
    updatedAt: isoInstant,
  })
  .superRefine((checkpoint, context) => {
    if (
      checkpoint.endOffset < checkpoint.startOffset ||
      checkpoint.nextOffset < checkpoint.startOffset ||
      checkpoint.nextOffset > checkpoint.endOffset
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextOffset"],
        message: "Replay checkpoint offsets are internally inconsistent",
      });
    }
    if (checkpoint.replayedEvents > checkpoint.discoveredEvents) {
      context.addIssue({
        code: "custom",
        path: ["replayedEvents"],
        message: "Replayed events cannot exceed discovered events",
      });
    }
  });

export const healthSchema = z.object({
  status: z.string(),
  components: z
    .record(
      z.string(),
      z.object({ status: z.string(), details: z.record(z.string(), z.unknown()).optional() }),
    )
    .optional(),
});

/** Converts malformed service payloads into a safe gateway-style application error. */
export function parseContract<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(
      502,
      {
        title: "Invalid service response",
        detail: "The backend response did not match the expected API contract.",
        status: 502,
      },
      null,
    );
  }
  return parsed.data;
}
