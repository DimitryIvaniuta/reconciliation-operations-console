import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Filter, Search } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { queryKeys } from "../../api/query-keys";
import { type ReportFilters, reconciliationApi } from "../../api/reconciliation-api";
import { EmptyState, ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FieldShell, Input, Select } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";
import { ReconciliationStatusBadge } from "../../components/ui/StatusBadge";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";
import type { ReconciliationStatus } from "../../types/domain";
import { formatBusinessDate, formatInstant } from "../../utils/date";
import { formatAmount, formatCount, truncateMiddle } from "../../utils/format";

const PAGE_SIZE = 20;

export function ReportsPage() {
  useDocumentTitle("Reports");
  const context = useApiContext();
  const [params, setParams] = useSearchParams();
  const filters = useMemo<ReportFilters>(() => {
    const fromDate = params.get("from");
    const toDate = params.get("to");
    const rawStatus = params.get("status");
    const status: ReconciliationStatus | null =
      rawStatus === "MATCHED" || rawStatus === "MISMATCH" ? rawStatus : null;
    return {
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(status ? { status } : {}),
      page: Math.max(0, Number(params.get("page") ?? 0) || 0),
      size: PAGE_SIZE,
    };
  }, [params]);
  const query = useQuery({
    queryKey: queryKeys.reports(filters),
    queryFn: ({ signal }) => reconciliationApi.reports(context, filters, signal),
  });

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "0");
    setParams(next);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Auditable evidence"
        title="Reconciliation reports"
        description="Search immutable daily reports by date and outcome, then inspect exact partition offsets and operator actions."
      />
      <Card className="filter-card">
        <div className="filters-grid">
          <FieldShell label="From date" htmlFor="from-date">
            <Input
              id="from-date"
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(event) => update("from", event.target.value)}
            />
          </FieldShell>
          <FieldShell label="To date" htmlFor="to-date">
            <Input
              id="to-date"
              type="date"
              value={filters.toDate ?? ""}
              onChange={(event) => update("to", event.target.value)}
            />
          </FieldShell>
          <FieldShell label="Status" htmlFor="status">
            <Select
              id="status"
              value={filters.status ?? ""}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="MATCHED">Matched</option>
              <option value="MISMATCH">Mismatch</option>
            </Select>
          </FieldShell>
          <div className="filter-summary">
            <Filter size={17} />
            <span>Page {filters.page + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => setParams({})}>
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Report ledger" subtitle="Newest reports appear first">
        {query.isLoading ? (
          <LoadingState label="Searching reports" />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : query.data?.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Trigger</th>
                    <th>Kafka / DB</th>
                    <th>Amount variance</th>
                    <th>Issues</th>
                    <th>Correlation</th>
                    <th>Created</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((report) => (
                    <tr key={report.reportId}>
                      <td>
                        <ReconciliationStatusBadge status={report.status} />
                      </td>
                      <td>{formatBusinessDate(report.businessDate)}</td>
                      <td>{report.triggerType.replaceAll("_", " ")}</td>
                      <td>
                        {formatCount(report.kafkaEventCount)} /{" "}
                        {formatCount(report.databaseRecordCount)}
                      </td>
                      <td>{formatAmount(report.databaseAmount - report.aggregateAmount)}</td>
                      <td>{report.issues.length}</td>
                      <td>
                        <code>{truncateMiddle(report.correlationId)}</code>
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
            <div className="pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page === 0}
                onClick={() => update("page", String(filters.page - 1))}
                icon={<ArrowLeft size={15} />}
              >
                Previous
              </Button>
              <span>Page {filters.page + 1}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={query.data.length < PAGE_SIZE}
                onClick={() => update("page", String(filters.page + 1))}
                icon={<ArrowRight size={15} />}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No reports found"
            detail="Adjust the filters or run a manual reconciliation."
            action={
              <Link className="button button--primary button--md" to="/reconciliations">
                <Search size={16} />
                Run reconciliation
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
