import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { LoadingState } from "../components/feedback/AsyncState";
import { AppShell } from "../components/layout/AppShell";
import {
  DashboardPage,
  EventPublishPage,
  MetricsPage,
  NotFoundPage,
  ReconciliationRunPage,
  ReplayDetailPage,
  ReplaysPage,
  ReportDetailPage,
  ReportsPage,
  SettingsPage,
} from "./routes";

function RouteFallback() {
  return (
    <div className="page" aria-live="polite">
      <LoadingState label="Loading workspace" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventPublishPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="reconciliations" element={<ReconciliationRunPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:reportId" element={<ReportDetailPage />} />
          <Route path="replays" element={<ReplaysPage />} />
          <Route path="replays/:jobId" element={<ReplayDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
