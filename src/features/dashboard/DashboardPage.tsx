import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  Database,
  FileWarning,
  RadioTower,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { ReconciliationStatusBadge } from "../../components/ui/StatusBadge";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { formatBusinessDate, formatInstant, yesterdayDateInput } from "../../utils/date";
import { formatAmount, formatCount } from "../../utils/format";

const MetricsComparisonChart = lazy(async () => ({
  default: (await import("../../components/charts/MetricsComparisonChart")).MetricsComparisonChart,
}));

export function DashboardPage() {
  useDocumentTitle("Overview");
  const context = useApiContext();
  const date = yesterdayDateInput();
  const metrics = useQuery({
    queryKey: queryKeys.metrics(date),
    queryFn: ({ signal }) => reconciliationApi.metrics(context, date, signal),
  });
  const reports = useQuery({
    queryKey: queryKeys.reports({ fromDate: date, toDate: date, page: 0, size: 5 }),
    queryFn: ({ signal }) =>
      reconciliationApi.reports(
        context,
        { fromDate: date, toDate: date, page: 0, size: 5 },
        signal,
      ),
  });
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => reconciliationApi.health(context, signal),
    refetchInterval: 30_000,
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operations overview"
        title="Good morning, operator"
        description={`Settlement and data-quality position for ${formatBusinessDate(date)}.`}
        actions={
          <Link className="button button--primary button--md" to={`/reconciliations?date=${date}`}>
            Run reconciliation <ArrowRight size={17} />
          </Link>
        }
      />

      <div className="system-banner">
        <div className="system-banner__status">
          <span
            className={health.data?.status === "UP" ? "pulse-dot" : "pulse-dot pulse-dot--danger"}
          />
          <strong>
            Backend {health.data?.status ?? (health.isLoading ? "checking" : "unavailable")}
          </strong>
        </div>
        <span>Health is refreshed every 30 seconds</span>
      </div>

      {metrics.isLoading ? (
        <LoadingState />
      ) : metrics.isError ? (
        <ErrorState error={metrics.error} retry={() => metrics.refetch()} />
      ) : (
        metrics.data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Kafka observations"
                value={formatCount(metrics.data.consumedEventCount)}
                caption="Consumed source positions"
                icon={<RadioTower />}
              />
              <StatCard
                label="Database records"
                value={formatCount(metrics.data.databaseRecordCount)}
                caption="Projected business rows"
                icon={<Database />}
              />
              <StatCard
                label="Database amount"
                value={formatAmount(metrics.data.databaseAmount)}
                caption="Independent persisted total"
                icon={<CircleDollarSign />}
              />
              <StatCard
                label="Count variance"
                value={formatCount(
                  metrics.data.databaseRecordCount - metrics.data.aggregateRecordCount,
                )}
                caption="Database minus aggregate"
                icon={<Activity />}
              />
            </div>

            <div className="dashboard-grid">
              <Card
                title="Evidence comparison"
                subtitle="Four independently maintained daily counters"
              >
                <Suspense fallback={<LoadingState label="Loading comparison chart" />}>
                  <MetricsComparisonChart metrics={metrics.data} />
                </Suspense>
              </Card>
              <Card
                title="Position summary"
                subtitle={`Updated ${formatInstant(metrics.data.updatedAt)}`}
              >
                <dl className="position-list">
                  <div>
                    <dt>Unique event IDs</dt>
                    <dd>{formatCount(metrics.data.uniqueEventCount)}</dd>
                  </div>
                  <div>
                    <dt>Aggregate records</dt>
                    <dd>{formatCount(metrics.data.aggregateRecordCount)}</dd>
                  </div>
                  <div>
                    <dt>Aggregate amount</dt>
                    <dd>{formatAmount(metrics.data.aggregateAmount)}</dd>
                  </div>
                  <div>
                    <dt>Amount variance</dt>
                    <dd>
                      {formatAmount(metrics.data.databaseAmount - metrics.data.aggregateAmount)}
                    </dd>
                  </div>
                </dl>
                <Link className="text-link" to={`/metrics?date=${date}`}>
                  Open daily metrics <ArrowRight size={15} />
                </Link>
              </Card>
            </div>
          </>
        )
      )}

      <Card
        title="Latest reconciliation evidence"
        subtitle="Immutable reports for the selected settlement day"
        action={
          <Link className="text-link" to="/reports">
            View all reports
          </Link>
        }
      >
        {reports.isLoading ? (
          <LoadingState label="Loading reports" />
        ) : reports.isError ? (
          <ErrorState error={reports.error} retry={() => reports.refetch()} />
        ) : reports.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Trigger</th>
                  <th>Kafka</th>
                  <th>Database</th>
                  <th>Issues</th>
                  <th>Created</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.data.map((report) => (
                  <tr key={report.reportId}>
                    <td>
                      <ReconciliationStatusBadge status={report.status} />
                    </td>
                    <td>{report.triggerType.replaceAll("_", " ")}</td>
                    <td>{formatCount(report.kafkaEventCount)}</td>
                    <td>{formatCount(report.databaseRecordCount)}</td>
                    <td>
                      {report.issues.length ? (
                        <span className="issue-count">
                          <FileWarning size={15} />
                          {report.issues.length}
                        </span>
                      ) : (
                        "None"
                      )}
                    </td>
                    <td>{formatInstant(report.createdAt)}</td>
                    <td>
                      <Link
                        className="row-link"
                        to={`/reports/${report.reportId}`}
                        aria-label={`Open report ${report.reportId}`}
                      >
                        <ArrowRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No reports exist for {formatBusinessDate(date)}.</p>
        )}
      </Card>
    </div>
  );
}
