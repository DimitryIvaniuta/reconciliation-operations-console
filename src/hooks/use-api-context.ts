import { useMemo } from "react";
import type { ApiContext } from "../api/reconciliation-api";
import { useAuth } from "../auth/auth-context";
import { appConfig } from "../config/runtime-config";

/** Builds a stable context shared by every API query and mutation. */
export function useApiContext(): ApiContext {
  const { apiKey } = useAuth();
  return useMemo(
    () => ({
      apiBaseUrl: appConfig.apiBaseUrl,
      healthBaseUrl: appConfig.healthBaseUrl,
      apiKey,
    }),
    [apiKey],
  );
}
