import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/http-client";

/** Conservative retry policy avoids repeating invalid or unauthorized operations. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      networkMode: "online",
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt, error) => {
        if (error instanceof ApiError && error.retryAfterSeconds !== null) {
          return Math.min(error.retryAfterSeconds * 1_000, 30_000);
        }
        return Math.min(1_000 * 2 ** attempt, 10_000);
      },
    },
    mutations: { retry: false, networkMode: "online" },
  },
});
