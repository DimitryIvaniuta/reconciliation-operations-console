import { UNAUTHORIZED_EVENT } from "../auth/session";
import type { ProblemDetail } from "../types/domain";

const MAX_ERROR_BODY_LENGTH = 8_192;
const MAX_SUCCESS_BODY_LENGTH = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  apiKey?: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail;
  readonly correlationId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    problem: ProblemDetail,
    correlationId: string | null,
    retryAfterSeconds: number | null = null,
  ) {
    super(problem.detail || problem.title || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.correlationId = correlationId;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Minimal fetch client with bounded payloads, timeout, cancellation, correlation IDs, safe problem
 * parsing, and optional session-only API-key authentication. It never logs secrets or bodies.
 */
export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const target = new URL(url, window.location.origin);
  if (target.origin !== window.location.origin) {
    throw new ApiError(
      0,
      {
        title: "Blocked cross-origin request",
        detail: "Service requests must remain on the application origin.",
      },
      null,
    );
  }

  const { apiKey, body, signal: externalSignal, ...requestInit } = options;
  const requestController = new AbortController();
  let timedOut = false;
  const forwardExternalAbort = () => requestController.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", forwardExternalAbort, { once: true });
  if (externalSignal?.aborted) forwardExternalAbort();

  const timeout = window.setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, REQUEST_TIMEOUT_MS);
  const correlationId = crypto.randomUUID();
  const headers = new Headers(requestInit.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Correlation-ID", correlationId);

  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (apiKey) headers.set("X-API-Key", apiKey);

  try {
    const response = await fetch(target, {
      ...requestInit,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: requestController.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const apiError = await toApiError(response);
      if (apiError.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      throw apiError;
    }

    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      throw invalidResponse(response, "The backend returned a non-JSON success response.");
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_SUCCESS_BODY_LENGTH) {
      throw invalidResponse(response, "The backend response exceeded the accepted size limit.");
    }
    let text: string;
    try {
      text = await readBoundedText(response, MAX_SUCCESS_BODY_LENGTH);
    } catch (error) {
      if (error instanceof ResponseBodyTooLargeError) {
        throw invalidResponse(response, "The backend response exceeded the accepted size limit.");
      }
      throw error;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw invalidResponse(response, "The backend returned malformed JSON.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Preserve caller-driven AbortError so TanStack Query can revert cancelled query state.
    if (externalSignal?.aborted && !timedOut) throw error;
    if (timedOut) {
      throw new ApiError(408, { title: "Request timed out", status: 408 }, correlationId);
    }
    throw new ApiError(
      0,
      { title: "Network error", detail: "The service could not be reached." },
      correlationId,
    );
  } finally {
    externalSignal?.removeEventListener("abort", forwardExternalAbort);
    window.clearTimeout(timeout);
  }
}

function invalidResponse(response: Response, detail: string): ApiError {
  return new ApiError(
    502,
    { title: "Invalid service response", detail, status: 502 },
    response.headers.get("X-Correlation-ID"),
  );
}

async function toApiError(response: Response): Promise<ApiError> {
  const correlationId = response.headers.get("X-Correlation-ID");
  const contentType = response.headers.get("content-type") ?? "";
  let problem: ProblemDetail = { status: response.status, title: response.statusText };

  if (contentType.includes("json")) {
    try {
      const text = await readBoundedText(response, MAX_ERROR_BODY_LENGTH, true);
      problem = normalizeProblem(JSON.parse(text), problem);
    } catch {
      problem.detail = "The server returned an unreadable error response.";
    }
  }

  return new ApiError(
    response.status,
    problem,
    correlationId,
    parseRetryAfter(response.headers.get("Retry-After")),
  );
}

function normalizeProblem(value: unknown, fallback: ProblemDetail): ProblemDetail {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  return {
    ...fallback,
    ...(typeof record.type === "string" ? { type: record.type.slice(0, 512) } : {}),
    ...(typeof record.title === "string" ? { title: record.title.slice(0, 512) } : {}),
    ...(typeof record.status === "number" && Number.isInteger(record.status)
      ? { status: record.status }
      : {}),
    ...(typeof record.detail === "string" ? { detail: record.detail.slice(0, 4_096) } : {}),
    ...(typeof record.instance === "string" ? { instance: record.instance.slice(0, 1_024) } : {}),
    ...(typeof record.correlationId === "string"
      ? { correlationId: record.correlationId.slice(0, 256) }
      : {}),
  };
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1_000));
}

class ResponseBodyTooLargeError extends Error {}

/** Reads a response incrementally so an absent or dishonest Content-Length cannot exhaust memory. */
async function readBoundedText(
  response: Response,
  maximumBytes: number,
  truncate = false,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  const parts: string[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    const remaining = maximumBytes - receivedBytes;
    if (value.byteLength > remaining) {
      await reader.cancel();
      if (!truncate) throw new ResponseBodyTooLargeError();
      if (remaining > 0) parts.push(decoder.decode(value.subarray(0, remaining), { stream: true }));
      parts.push(decoder.decode());
      return parts.join("");
    }

    receivedBytes += value.byteLength;
    parts.push(decoder.decode(value, { stream: true }));
  }

  parts.push(decoder.decode());
  return parts.join("");
}
