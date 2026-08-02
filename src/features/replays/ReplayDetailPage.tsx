import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, CircleGauge, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { EmptyState, ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { CopyButton } from "../../components/ui/CopyButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { ReplayStatusBadge } from "../../components/ui/StatusBadge";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { useRecentReplays } from "../../hooks/use-recent-replays";
import { formatBusinessDate, formatInstant } from "../../utils/date";
import { formatCount, formatPercent } from "../../utils/format";
import { isUuid } from "../../utils/ids";

export function ReplayDetailPage() {
  const { jobId = "" } = useParams();
  useDocumentTitle("Replay detail");
  const context = useApiContext();
  const validJobId = isUuid(jobId);
  const queryClient = useQueryClient();
  const { remember } = useRecentReplays();
  const [retryConfirmationOpen, setRetryConfirmationOpen] = useState(false);
  const job = useQuery({
    queryKey: queryKeys.replay(jobId),
    queryFn: ({ signal }) => reconciliationApi.replay(context, jobId, signal),
    enabled: validJobId,
    refetchInterval: (query) =>
      ["REQUESTED", "RUNNING"].includes(query.state.data?.status ?? "") ? 3_000 : false,
  });
  const checkpoints = useQuery({
    queryKey: queryKeys.replayCheckpoints(jobId),
    queryFn: ({ signal }) => reconciliationApi.replayCheckpoints(context, jobId, signal),
    enabled: validJobId && Boolean(job.data),
    refetchInterval: job.data && ["REQUESTED", "RUNNING"].includes(job.data.status) ? 3_000 : false,
  });
  const retry = useMutation({
    mutationFn: () => reconciliationApi.retryReplay(context, jobId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.replay(jobId), data);
      toast.success("Replay retry accepted");
    },
    onError: (error: Error) => toast.error("Replay retry failed", { description: error.message }),
    onSettled: () => setRetryConfirmationOpen(false),
  });

  useEffect(() => {
    if (job.data?.jobId) remember(job.data.jobId);
  }, [job.data?.jobId, remember]);

  if (!validJobId) {
    return (
      <div className="page">
        <EmptyState
          title="Invalid replay identifier"
          detail="Replay links must contain a valid UUID. No backend request was sent."
          action={
            <Link className="button button--primary button--md" to="/replays">
              Return to replay jobs
            </Link>
          }
        />
      </div>
    );
  }

  if (job.isLoading)
    return (
      <div className="page">
        <LoadingState label="Loading replay job" />
      </div>
    );
  if (job.isError)
    return (
      <div className="page">
        <ErrorState error={job.error} retry={() => job.refetch()} />
      </div>
    );
  const data = job.data;
  if (!data) return null;
  const totalRange =
    checkpoints.data?.reduce(
      (sum, checkpoint) => sum + checkpoint.endOffset - checkpoint.startOffset,
      0,
    ) ?? 0;
  const completedRange =
    checkpoints.data?.reduce(
      (sum, checkpoint) => sum + checkpoint.nextOffset - checkpoint.startOffset,
      0,
    ) ?? 0;
  const progress = totalRange ? completedRange / totalRange : data.status === "COMPLETED" ? 1 : 0;

  return (
    <div className="page">
      <Link className="back-link" to="/replays">
        <ArrowLeft size={16} />
        Back to replay requests
      </Link>
      <PageHeader
        eyebrow="Durable replay job"
        title={`${data.dryRun ? "Dry-run" : "Repair"} · ${formatBusinessDate(data.fromDate)} to ${formatBusinessDate(data.toDate)}`}
        description={`Requested by ${data.requestedBy} at ${formatInstant(data.requestedAt)}.`}
        actions={<ReplayStatusBadge status={data.status} />}
      />
      <div className="stats-grid">
        <StatCard
          label="Progress"
          value={formatPercent(progress)}
          caption={`${formatCount(completedRange)} of ${formatCount(totalRange)} source offsets`}
          icon={<CircleGauge />}
        />
        <StatCard
          label="Discovered"
          value={formatCount(data.discoveredEvents)}
          caption="Candidate source records"
          icon={<CalendarRange />}
        />
        <StatCard
          label="Replayed"
          value={formatCount(data.replayedEvents)}
          caption={data.dryRun ? "Dry-run does not apply events" : "Projection attempts completed"}
          icon={<RotateCcw />}
        />
        <StatCard
          label="Attempt"
          value={formatCount(data.attemptCount)}
          caption={`Last heartbeat ${formatInstant(data.heartbeatAt)}`}
          icon={<RefreshCw />}
        />
      </div>
      <Card
        title="Job progress"
        subtitle="Progress is calculated from durable partition checkpoints"
      >
        <div className="progress">
          <progress
            className="progress__bar"
            max={1}
            value={Math.min(progress, 1)}
            aria-label={`Replay progress ${formatPercent(progress)}`}
          />
          <span aria-hidden="true">{formatPercent(progress)}</span>
        </div>
        {data.errorMessage && (
          <div className="error-banner" role="alert">
            <strong>Last error</strong>
            <p>{data.errorMessage}</p>
          </div>
        )}
        <div className="result-hero__actions">
          {data.status === "FAILED" && (
            <Button
              loading={retry.isPending}
              onClick={() => setRetryConfirmationOpen(true)}
              icon={<RefreshCw size={17} />}
            >
              Retry failed job
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              job.refetch();
              checkpoints.refetch();
            }}
            icon={<RefreshCw size={17} />}
          >
            Refresh
          </Button>
        </div>
      </Card>
      <div className="dashboard-grid">
        <Card title="Audit identity">
          <dl className="identity-list">
            <div>
              <dt>Job ID</dt>
              <dd>
                <code>{data.jobId}</code>
                <CopyButton value={data.jobId} />
              </dd>
            </div>
            <div>
              <dt>Idempotency key</dt>
              <dd>
                <code>{data.idempotencyKey}</code>
                <CopyButton value={data.idempotencyKey} />
              </dd>
            </div>
            <div>
              <dt>Correlation ID</dt>
              <dd>
                <code>{data.correlationId}</code>
                <CopyButton value={data.correlationId} />
              </dd>
            </div>
          </dl>
        </Card>
        <Card title="Lifecycle timestamps">
          <dl className="position-list">
            <div>
              <dt>Command published</dt>
              <dd>{formatInstant(data.commandPublishedAt)}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatInstant(data.startedAt)}</dd>
            </div>
            <div>
              <dt>Heartbeat</dt>
              <dd>{formatInstant(data.heartbeatAt)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{formatInstant(data.completedAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card
        title="Partition checkpoints"
        subtitle="Every source range is bounded and resumes from its durable next offset"
      >
        {checkpoints.isLoading ? (
          <LoadingState label="Loading checkpoints" />
        ) : checkpoints.isError ? (
          <ErrorState error={checkpoints.error} retry={() => checkpoints.refetch()} />
        ) : checkpoints.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Partition</th>
                  <th>Status</th>
                  <th>Offset range</th>
                  <th>Next offset</th>
                  <th>Discovered</th>
                  <th>Replayed</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {checkpoints.data.map((checkpoint) => (
                  <tr key={`${checkpoint.sourceTopic}-${checkpoint.sourcePartition}`}>
                    <td>
                      <code>{checkpoint.sourceTopic}</code>
                    </td>
                    <td>{checkpoint.sourcePartition}</td>
                    <td>
                      <ReplayStatusBadge status={checkpoint.status} />
                    </td>
                    <td>
                      {formatCount(checkpoint.startOffset)}–{formatCount(checkpoint.endOffset)}
                    </td>
                    <td>{formatCount(checkpoint.nextOffset)}</td>
                    <td>{formatCount(checkpoint.discoveredEvents)}</td>
                    <td>{formatCount(checkpoint.replayedEvents)}</td>
                    <td>{formatInstant(checkpoint.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Partition snapshots have not been created yet.</p>
        )}
      </Card>

      <ConfirmDialog
        open={retryConfirmationOpen}
        title="Retry failed replay"
        description={`Retry attempt ${data.attemptCount + 1} for ${data.jobId}. Existing durable checkpoints will be reused and stale workers remain fenced.`}
        confirmLabel="Retry replay"
        busy={retry.isPending}
        onCancel={() => setRetryConfirmationOpen(false)}
        onConfirm={() => retry.mutate()}
      />
    </div>
  );
}
