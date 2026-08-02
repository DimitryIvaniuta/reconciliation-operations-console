import { type ComponentType, lazy } from "react";

/**
 * Central route-module registry. Keeping dynamic imports in one place makes route splitting
 * deterministic and lets navigation links opportunistically prefetch the same module.
 */
const routeModules = {
  dashboard: () => import("../features/dashboard/DashboardPage"),
  events: () => import("../features/events/EventPublishPage"),
  metrics: () => import("../features/metrics/MetricsPage"),
  reconciliation: () => import("../features/reports/ReconciliationRunPage"),
  reports: () => import("../features/reports/ReportsPage"),
  reportDetail: () => import("../features/reports/ReportDetailPage"),
  replays: () => import("../features/replays/ReplaysPage"),
  replayDetail: () => import("../features/replays/ReplayDetailPage"),
  settings: () => import("../features/settings/SettingsPage"),
  notFound: () => import("./NotFoundPage"),
} as const;

function lazyNamed<TModule, TName extends keyof TModule>(
  load: () => Promise<TModule>,
  name: TName,
) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}

export const DashboardPage = lazyNamed(routeModules.dashboard, "DashboardPage");
export const EventPublishPage = lazyNamed(routeModules.events, "EventPublishPage");
export const MetricsPage = lazyNamed(routeModules.metrics, "MetricsPage");
export const ReconciliationRunPage = lazyNamed(
  routeModules.reconciliation,
  "ReconciliationRunPage",
);
export const ReportsPage = lazyNamed(routeModules.reports, "ReportsPage");
export const ReportDetailPage = lazyNamed(routeModules.reportDetail, "ReportDetailPage");
export const ReplaysPage = lazyNamed(routeModules.replays, "ReplaysPage");
export const ReplayDetailPage = lazyNamed(routeModules.replayDetail, "ReplayDetailPage");
export const SettingsPage = lazyNamed(routeModules.settings, "SettingsPage");
export const NotFoundPage = lazyNamed(routeModules.notFound, "NotFoundPage");

/** Prefetches a route chunk after the operator expresses intent through hover or keyboard focus. */
export function preloadRoute(pathname: string): void {
  const load =
    pathname === "/"
      ? routeModules.dashboard
      : pathname.startsWith("/events")
        ? routeModules.events
        : pathname.startsWith("/metrics")
          ? routeModules.metrics
          : pathname.startsWith("/reconciliations")
            ? routeModules.reconciliation
            : pathname.startsWith("/reports/")
              ? routeModules.reportDetail
              : pathname.startsWith("/reports")
                ? routeModules.reports
                : pathname.startsWith("/replays/")
                  ? routeModules.replayDetail
                  : pathname.startsWith("/replays")
                    ? routeModules.replays
                    : pathname.startsWith("/settings")
                      ? routeModules.settings
                      : routeModules.notFound;

  void load();
}
