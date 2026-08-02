import { z } from "zod";
import type {
  BusinessEvent,
  DailyMetrics,
  HealthResponse,
  ReconciliationReport,
  ReconciliationStatus,
  ReplayJob,
  ReplayPartitionCheckpoint,
} from "../types/domain";
import { requestJson } from "./http-client";
import {
  businessEventSchema,
  dailyMetricsSchema,
  healthSchema,
  parseContract,
  reconciliationReportSchema,
  replayCheckpointSchema,
  replayJobSchema,
} from "./schemas";

export interface ApiContext {
  apiBaseUrl: string;
  healthBaseUrl: string;
  apiKey: string | null;
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  status?: ReconciliationStatus | "";
  page: number;
  size: number;
}

export interface ReplayRequestPayload {
  fromDate: string;
  toDate: string;
  dryRun: boolean;
  idempotencyKey: string;
  requestedBy: string;
}

const auth = (context: ApiContext, signal?: AbortSignal) => ({
  apiKey: context.apiKey,
  ...(signal ? { signal } : {}),
});
const parse = async <T>(promise: Promise<unknown>, schema: z.ZodType<T>): Promise<T> =>
  parseContract(schema, await promise);

export const reconciliationApi = {
  health(context: ApiContext, signal?: AbortSignal): Promise<HealthResponse> {
    return parse(
      requestJson<unknown>(`${context.healthBaseUrl}/health`, auth(context, signal)),
      healthSchema,
    );
  },

  publishEvent(context: ApiContext, event: BusinessEvent): Promise<BusinessEvent> {
    return parse(
      requestJson<unknown>(`${context.apiBaseUrl}/v1/events`, {
        method: "POST",
        body: event,
        ...auth(context),
      }),
      businessEventSchema,
    );
  },

  metrics(context: ApiContext, date: string, signal?: AbortSignal): Promise<DailyMetrics> {
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/daily-metrics/${encodeURIComponent(date)}`,
        auth(context, signal),
      ),
      dailyMetricsSchema,
    );
  },

  runReconciliation(context: ApiContext, date: string): Promise<ReconciliationReport> {
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/reconciliations/${encodeURIComponent(date)}/runs`,
        {
          method: "POST",
          ...auth(context),
        },
      ),
      reconciliationReportSchema,
    );
  },

  report(
    context: ApiContext,
    reportId: string,
    signal?: AbortSignal,
  ): Promise<ReconciliationReport> {
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/reconciliations/${encodeURIComponent(reportId)}`,
        auth(context, signal),
      ),
      reconciliationReportSchema,
    );
  },

  reports(
    context: ApiContext,
    filters: ReportFilters,
    signal?: AbortSignal,
  ): Promise<ReconciliationReport[]> {
    const search = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });
    if (filters.fromDate) search.set("fromDate", filters.fromDate);
    if (filters.toDate) search.set("toDate", filters.toDate);
    if (filters.status) search.set("status", filters.status);
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/reconciliations?${search.toString()}`,
        auth(context, signal),
      ),
      z.array(reconciliationReportSchema),
    );
  },

  requestReplay(context: ApiContext, payload: ReplayRequestPayload): Promise<ReplayJob> {
    return parse(
      requestJson<unknown>(`${context.apiBaseUrl}/v1/replays`, {
        method: "POST",
        headers: {
          "Idempotency-Key": payload.idempotencyKey,
          "X-Requested-By": payload.requestedBy,
        },
        body: { fromDate: payload.fromDate, toDate: payload.toDate, dryRun: payload.dryRun },
        ...auth(context),
      }),
      replayJobSchema,
    );
  },

  replay(context: ApiContext, jobId: string, signal?: AbortSignal): Promise<ReplayJob> {
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/replays/${encodeURIComponent(jobId)}`,
        auth(context, signal),
      ),
      replayJobSchema,
    );
  },

  replayCheckpoints(
    context: ApiContext,
    jobId: string,
    signal?: AbortSignal,
  ): Promise<ReplayPartitionCheckpoint[]> {
    return parse(
      requestJson<unknown>(
        `${context.apiBaseUrl}/v1/replays/${encodeURIComponent(jobId)}/checkpoints`,
        auth(context, signal),
      ),
      z.array(replayCheckpointSchema),
    );
  },

  retryReplay(context: ApiContext, jobId: string): Promise<ReplayJob> {
    return parse(
      requestJson<unknown>(`${context.apiBaseUrl}/v1/replays/${encodeURIComponent(jobId)}/retry`, {
        method: "POST",
        ...auth(context),
      }),
      replayJobSchema,
    );
  },
};
