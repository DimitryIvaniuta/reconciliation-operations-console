import type {
  ReconciliationStatus,
  ReplayCheckpointStatus,
  ReplayStatus,
} from "../../types/domain";
import { Badge } from "./Badge";

export function ReconciliationStatusBadge({ status }: { status: ReconciliationStatus }) {
  return <Badge tone={status === "MATCHED" ? "success" : "danger"}>{status}</Badge>;
}

export function ReplayStatusBadge({ status }: { status: ReplayStatus | ReplayCheckpointStatus }) {
  const tone =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : status === "RUNNING"
          ? "info"
          : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}
