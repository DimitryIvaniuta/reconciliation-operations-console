/** Validated runtime configuration injected by the hosting environment. */
export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly healthBaseUrl: string;
  readonly authMode: "proxy" | "session";
  readonly environment: string;
  readonly supportUrl?: string;
}

const defaults: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  healthBaseUrl: import.meta.env.VITE_HEALTH_BASE_URL ?? "/actuator",
  authMode: import.meta.env.VITE_AUTH_MODE === "proxy" ? "proxy" : "session",
  environment: import.meta.env.VITE_APP_ENVIRONMENT ?? "local",
};

/**
 * Reads runtime configuration without evaluating arbitrary code or exposing server-side secrets.
 * The production container generates `/config.js` before nginx starts.
 */
export function readAppConfig(): AppConfig {
  const runtime = window.__APP_CONFIG__ ?? {};
  const authMode = runtime.authMode === "proxy" ? "proxy" : defaults.authMode;

  return {
    apiBaseUrl: normalizeBaseUrl(runtime.apiBaseUrl ?? defaults.apiBaseUrl),
    healthBaseUrl: normalizeBaseUrl(runtime.healthBaseUrl ?? defaults.healthBaseUrl),
    authMode,
    environment: runtime.environment?.trim() || defaults.environment,
    ...(runtime.supportUrl?.trim() ? { supportUrl: normalizeSupportUrl(runtime.supportUrl) } : {}),
  };
}

function normalizeSupportUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length > 2_048) throw new Error("Runtime support URL is too long");
  const parsed = new URL(trimmed, window.location.origin);
  const sameOriginHttp =
    parsed.origin === window.location.origin && ["http:", "https:"].includes(parsed.protocol);
  if (parsed.protocol !== "https:" && !sameOriginHttp) {
    throw new Error("Runtime support URL must use HTTPS or remain on the application origin");
  }
  return parsed.href;
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Runtime API base URL must not be blank");
  const parsed = new URL(trimmed, window.location.origin);
  if (parsed.origin !== window.location.origin) {
    throw new Error("Runtime service URLs must remain on the application origin");
  }
  if (parsed.search || parsed.hash)
    throw new Error("Runtime service URLs cannot contain query strings or fragments");
  const normalized = parsed.pathname;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export const appConfig = readAppConfig();
