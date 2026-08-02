import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Clock3, PlayCircle, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { reconciliationApi } from "../../api/reconciliation-api";
import { EmptyState } from "../../components/feedback/AsyncState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FieldShell, Input } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { useRecentReplays } from "../../hooks/use-recent-replays";
import { yesterdayDateInput } from "../../utils/date";
import { truncateMiddle } from "../../utils/format";
import { createUuid } from "../../utils/ids";

const schema = z
  .object({
    fromDate: z.string().min(1, "Start date is required"),
    toDate: z.string().min(1, "End date is required"),
    dryRun: z.boolean(),
    requestedBy: z.string().trim().min(2, "Operator identity is required").max(128),
    idempotencyKey: z.string().trim().min(8, "Use at least 8 characters").max(200),
  })
  .refine((value) => value.toDate >= value.fromDate, {
    path: ["toDate"],
    message: "End date cannot be before start date",
  });

type FormValues = z.infer<typeof schema>;

export function ReplaysPage() {
  useDocumentTitle("Replay & backfill");
  const context = useApiContext();
  const navigate = useNavigate();
  const { ids, remember, remove } = useRecentReplays();
  const [pendingRepair, setPendingRepair] = useState<FormValues | null>(null);
  const date = yesterdayDateInput();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromDate: date,
      toDate: date,
      dryRun: true,
      requestedBy: "operations-console",
      idempotencyKey: createUuid(),
    },
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => reconciliationApi.requestReplay(context, values),
    onSuccess: (job) => {
      remember(job.jobId);
      toast.success("Replay job accepted", { description: job.jobId });
      navigate(`/replays/${job.jobId}`);
    },
    onError: (error: Error) => toast.error("Replay request failed", { description: error.message }),
    onSettled: () => setPendingRepair(null),
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="Controlled repair"
        title="Replay & backfill"
        description="Create bounded, durable replay jobs with stable Kafka offset snapshots, idempotency, and per-partition checkpoints."
      />
      <div className="form-layout">
        <Card
          title="New replay request"
          subtitle="Start with dry-run to measure the bounded source range without applying projections"
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) => {
              if (values.dryRun) mutation.mutate(values);
              else setPendingRepair(values);
            })}
          >
            <FieldShell
              label="From date"
              htmlFor="fromDate"
              error={form.formState.errors.fromDate?.message}
            >
              <Input id="fromDate" type="date" {...form.register("fromDate")} />
            </FieldShell>
            <FieldShell
              label="To date"
              htmlFor="toDate"
              error={form.formState.errors.toDate?.message}
            >
              <Input id="toDate" type="date" {...form.register("toDate")} />
            </FieldShell>
            <FieldShell
              label="Requested by"
              htmlFor="requestedBy"
              error={form.formState.errors.requestedBy?.message}
            >
              <Input id="requestedBy" autoComplete="username" {...form.register("requestedBy")} />
            </FieldShell>
            <FieldShell
              label="Idempotency key"
              htmlFor="idempotencyKey"
              error={form.formState.errors.idempotencyKey?.message}
              hint="Reuse only for the exact same request payload"
            >
              <div className="input-action">
                <Input
                  id="idempotencyKey"
                  spellCheck={false}
                  {...form.register("idempotencyKey")}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue("idempotencyKey", createUuid())}
                >
                  Generate
                </Button>
              </div>
            </FieldShell>
            <label className="toggle form-grid__wide">
              <input type="checkbox" {...form.register("dryRun")} />
              <span className="toggle__track" />
              <span>
                <strong>Dry-run only</strong>
                <small>
                  Discover and count candidates without modifying projections or aggregates.
                </small>
              </span>
            </label>
            <div className="form-actions form-grid__wide">
              <Button type="submit" loading={mutation.isPending} icon={<PlayCircle size={17} />}>
                Request replay
              </Button>
            </div>
          </form>
        </Card>
        <aside className="info-panel">
          <RotateCcw aria-hidden="true" />
          <h2>Safe replay lifecycle</h2>
          <p>
            The backend snapshots end offsets, stores progress after bounded batches, fences stale
            workers by execution attempt, and validates repaired dates through fresh reconciliation
            reports.
          </p>
        </aside>
      </div>

      <Card
        title="Recently opened replay jobs"
        subtitle="Stored locally as non-sensitive navigation history; job state always comes from PostgreSQL"
      >
        {ids.length ? (
          <div className="recent-list">
            {ids.map((id) => (
              <div className="recent-list__item" key={id}>
                <Clock3 size={17} aria-hidden="true" />
                <code>{truncateMiddle(id, 12, 10)}</code>
                <Link className="text-link" to={`/replays/${id}`}>
                  Open <ArrowRight size={14} />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(id)}
                  icon={<Trash2 size={14} />}
                  aria-label={`Remove ${id} from recent jobs`}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent replay jobs"
            detail="Create a dry-run replay or open a known job ID from the header search."
          />
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingRepair)}
        title="Confirm projection repair"
        description={
          pendingRepair
            ? `Replay source events from ${pendingRepair.fromDate} through ${pendingRepair.toDate} as ${pendingRepair.requestedBy}. This may modify projections and daily aggregates.`
            : ""
        }
        confirmLabel="Start repair replay"
        busy={mutation.isPending}
        onCancel={() => setPendingRepair(null)}
        onConfirm={() => {
          if (pendingRepair) mutation.mutate(pendingRepair);
        }}
      />
    </div>
  );
}
