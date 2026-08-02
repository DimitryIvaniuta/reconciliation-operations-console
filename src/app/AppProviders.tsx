import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { AuthGate } from "../auth/AuthGate";
import { AuthProvider } from "../auth/AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { queryClient } from "./query-client";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
