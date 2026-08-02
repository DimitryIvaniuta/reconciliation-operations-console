import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { ApiError } from "../../api/http-client";
import { Button } from "../ui/Button";

export function LoadingState({ label = "Loading operational data" }: { label?: string }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="state__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="state state--empty">
      <Inbox aria-hidden="true" />
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  const correlationId = error instanceof ApiError ? error.correlationId : null;
  const retryAfter = error instanceof ApiError ? error.retryAfterSeconds : null;
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <h3>Unable to load data</h3>
      <p>{message}</p>
      {correlationId && <small>Correlation ID: {correlationId}</small>}
      {retryAfter !== null && <small>Retry available in approximately {retryAfter}s.</small>}
      {retry && (
        <Button variant="secondary" size="sm" onClick={retry} icon={<RefreshCw size={15} />}>
          Try again
        </Button>
      )}
    </div>
  );
}
