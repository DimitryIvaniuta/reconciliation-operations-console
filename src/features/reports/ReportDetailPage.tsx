import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleAlert, Database, RadioTower } from "lucide-react";
import { Link, useParams } from "react-router";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { EmptyState, ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Card } from "../../components/ui/Card";
import { CopyButton } from "../../components/ui/CopyButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { ReconciliationStatusBadge } from "../../components/ui/StatusBadge";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import { formatBusinessDate, formatInstant } from "../../utils/date";
import { formatAmount, formatCount } from "../../utils/format";
import { isUuid } from "../../utils/ids";

const mismatchLabels: Record<string, string> = {
  KAFKA_VS_SOURCE_OBSERVATIONS: "Kafka records vs consumed observations",
  SOURCE_OBSERVATIONS_VS_UNIQUE_EVENTS: "Source observations vs unique event IDs",
  UNIQUE_EVENTS_VS_DATABASE: "Unique event IDs vs database rows",
  DATABASE_VS_AGGREGATE_COUNT: "Database rows vs aggregate count",
  DATABASE_VS_AGGREGATE_AMOUNT: "Database amount vs aggregate amount",
};

export function ReportDetailPage() {
  const { reportId = "" } = useParams();
  useDocumentTitle("Report detail");
  const context = useApiContext();
  const validReportId = isUuid(reportId);
  const query = useQuery({
    queryKey: queryKeys.report(reportId),
    queryFn: ({ signal }) => reconciliationApi.report(context, reportId, signal),
    enabled: validReportId,
  });

  if (!validReportId) {
    return (
      <div className="page">
        <EmptyState
          title="Invalid report identifier"
          detail="Report links must contain a valid UUID. No backend request was sent."
          action={
            <Link className="button button--primary button--md" to="/reports">
              Return to reports
            </Link>
          }
        />
      </div>
    );
  }

  if (query.isLoading)
    return (
      <div className="page">
        <LoadingState label="Loading immutable report" />
      </div>
    );
  if (query.isError)
    return (
      <div className="page">
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </div>
    );
  const report = query.data;
  if (!report) return null;

  return (
    <div className="page">
      <Link className="back-link" to="/reports">
        <ArrowLeft size={16} />
        Back to reports
      </Link>
      <PageHeader
        eyebrow="Immutable reconciliation evidence"
        title={`Report for ${formatBusinessDate(report.businessDate)}`}
        description={`Created ${formatInstant(report.createdAt)} by ${report.triggerType.replaceAll("_", " ").toLowerCase()}.`}
        actions={<ReconciliationStatusBadge status={report.status} />}
      />
      <div className="stats-grid">
        <StatCard
          label="Kafka records"
          value={formatCount(report.kafkaEventCount)}
          caption="Broker offset evidence"
          icon={<RadioTower />}
        />
        <StatCard
          label="Consumed observations"
          value={formatCount(report.consumedEventCount)}
          caption="Persisted source positions"
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Database records"
          value={formatCount(report.databaseRecordCount)}
          caption="Business projections"
          icon={<Database />}
        />
        <StatCard
          label="Issues"
          value={formatCount(report.issues.length)}
          caption="Actionable comparisons"
          icon={<CircleAlert />}
        />
      </div>
      <div className="dashboard-grid">
        <Card title="Evidence summary" subtitle="Independent counts and monetary totals">
          <dl className="position-list">
            <div>
              <dt>Unique event IDs</dt>
              <dd>{formatCount(report.uniqueEventCount)}</dd>
            </div>
            <div>
              <dt>Aggregate records</dt>
              <dd>{formatCount(report.aggregateRecordCount)}</dd>
            </div>
            <div>
              <dt>Database amount</dt>
              <dd>{formatAmount(report.databaseAmount)}</dd>
            </div>
            <div>
              <dt>Aggregate amount</dt>
              <dd>{formatAmount(report.aggregateAmount)}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Audit identity" subtitle="Use these values when escalating an incident">
          <dl className="identity-list">
            <div>
              <dt>Report ID</dt>
              <dd>
                <code>{report.reportId}</code>
                <CopyButton value={report.reportId} />
              </dd>
            </div>
            <div>
              <dt>Correlation ID</dt>
              <dd>
                <code>{report.correlationId}</code>
                <CopyButton value={report.correlationId} />
              </dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card
        title="Actionable mismatch analysis"
        subtitle={
          report.issues.length
            ? "Resolve each issue in order from source to aggregate"
            : "Every independent checkpoint matched"
        }
      >
        {report.issues.length ? (
          <div className="issue-list">
            {report.issues.map((issue) => (
              <article className="issue-card" key={issue.type}>
                <div className="issue-card__icon">
                  <CircleAlert aria-hidden="true" />
                </div>
                <div>
                  <h3>{mismatchLabels[issue.type] ?? issue.type}</h3>
                  <div className="issue-values">
                    <span>
                      Expected <strong>{issue.expected}</strong>
                    </span>
                    <span>
                      Actual <strong>{issue.actual}</strong>
                    </span>
                    <span>
                      Delta <strong>{issue.delta}</strong>
                    </span>
                  </div>
                  <p>{issue.action}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="success-panel">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <h3>No mismatches detected</h3>
              <p>
                Kafka, consumed observations, unique IDs, database rows, aggregate count, and amount
                are consistent.
              </p>
            </div>
          </div>
        )}
      </Card>
      <Card
        title="Kafka partition evidence"
        subtitle="Half-open offset ranges [start, end) used for this report"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Partition</th>
                <th>Start offset</th>
                <th>End offset</th>
                <th>Record count</th>
              </tr>
            </thead>
            <tbody>
              {report.sourceOffsets.map((range) => (
                <tr key={range.partition}>
                  <td>{range.partition}</td>
                  <td>{formatCount(range.startOffset)}</td>
                  <td>{formatCount(range.endOffset)}</td>
                  <td>{formatCount(range.endOffset - range.startOffset)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
