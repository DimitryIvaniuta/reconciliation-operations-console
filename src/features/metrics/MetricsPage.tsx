import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CircleDollarSign, Database, RadioTower } from "lucide-react";
import { useSearchParams } from "react-router";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { MetricsComparisonChart } from "../../components/charts/MetricsComparisonChart";
import { ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Card } from "../../components/ui/Card";
import { FieldShell, Input } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { formatBusinessDate, formatInstant, yesterdayDateInput } from "../../utils/date";
import { formatAmount, formatCount } from "../../utils/format";

export function MetricsPage() {
  useDocumentTitle("Daily metrics");
  const context = useApiContext();
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? yesterdayDateInput();
  const query = useQuery({
    queryKey: queryKeys.metrics(date),
    queryFn: ({ signal }) => reconciliationApi.metrics(context, date, signal),
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="Independent evidence"
        title="Daily metrics"
        description="Inspect the compact PostgreSQL counters maintained from actual source observations, unique events, projections, and aggregates."
      />
      <Card className="filter-card">
        <FieldShell
          label="UTC ingestion date"
          htmlFor="metrics-date"
          hint="The broker LogAppendTime determines the date"
        >
          <Input
            id="metrics-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setParams({ date: event.target.value })}
          />
        </FieldShell>
      </Card>
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        query.data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Consumed observations"
                value={formatCount(query.data.consumedEventCount)}
                caption="Kafka source positions seen"
                icon={<RadioTower />}
              />
              <StatCard
                label="Unique event IDs"
                value={formatCount(query.data.uniqueEventCount)}
                caption="Deduplicated ledger identities"
                icon={<CalendarDays />}
              />
              <StatCard
                label="Database records"
                value={formatCount(query.data.databaseRecordCount)}
                caption="Projected business rows"
                icon={<Database />}
              />
              <StatCard
                label="Database amount"
                value={formatAmount(query.data.databaseAmount)}
                caption="Independent monetary total"
                icon={<CircleDollarSign />}
              />
            </div>
            <div className="dashboard-grid">
              <Card
                title={`Count checkpoints · ${formatBusinessDate(date)}`}
                subtitle="Equal values indicate no count drift between checkpoints"
              >
                <MetricsComparisonChart metrics={query.data} />
              </Card>
              <Card
                title="Variance ledger"
                subtitle={`Last counter update ${formatInstant(query.data.updatedAt)}`}
              >
                <dl className="position-list">
                  <div>
                    <dt>Duplicate source observations</dt>
                    <dd>
                      {formatCount(query.data.consumedEventCount - query.data.uniqueEventCount)}
                    </dd>
                  </div>
                  <div>
                    <dt>Missing projections</dt>
                    <dd>
                      {formatCount(query.data.uniqueEventCount - query.data.databaseRecordCount)}
                    </dd>
                  </div>
                  <div>
                    <dt>Aggregate count drift</dt>
                    <dd>
                      {formatCount(
                        query.data.databaseRecordCount - query.data.aggregateRecordCount,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Aggregate amount drift</dt>
                    <dd>{formatAmount(query.data.databaseAmount - query.data.aggregateAmount)}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
