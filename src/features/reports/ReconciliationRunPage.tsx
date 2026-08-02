import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DatabaseZap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FieldShell, Input } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";
import { ReconciliationStatusBadge } from "../../components/ui/StatusBadge";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { yesterdayDateInput } from "../../utils/date";
import { formatCount } from "../../utils/format";

export function ReconciliationRunPage() {
  useDocumentTitle("Run reconciliation");
  const context = useApiContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? yesterdayDateInput());
  const mutation = useMutation({
    mutationFn: () => reconciliationApi.runReconciliation(context, date),
    onSuccess: (report) => {
      queryClient.setQueryData(queryKeys.report(report.reportId), report);
      toast.success("Reconciliation report created", { description: report.status });
    },
    onError: (error: Error) => toast.error("Reconciliation failed", { description: error.message }),
  });

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="Controlled execution"
        title="Run manual reconciliation"
        description="Create an immutable comparison report for one completed UTC ingestion day."
      />
      <Card
        title="Reconciliation parameters"
        subtitle="The operation uses partition offset lookups and compact daily metrics to keep database load low"
      >
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <FieldShell label="UTC ingestion date" htmlFor="run-date">
            <Input
              id="run-date"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </FieldShell>
          <Button type="submit" loading={mutation.isPending} icon={<DatabaseZap size={17} />}>
            Run reconciliation
          </Button>
        </form>
      </Card>
      {mutation.data && (
        <Card
          title="Report created"
          subtitle="This evidence is append-only and can be reopened by its report ID"
        >
          <div className="result-hero">
            <ReconciliationStatusBadge status={mutation.data.status} />
            <div>
              <strong>{formatCount(mutation.data.kafkaEventCount)} Kafka records</strong>
              <span>{formatCount(mutation.data.issues.length)} actionable issues</span>
            </div>
            <div className="result-hero__actions">
              <Link
                className="button button--primary button--md"
                to={`/reports/${mutation.data.reportId}`}
              >
                Open report
              </Link>
              <Button variant="secondary" onClick={() => navigate("/reports")}>
                View all reports
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
