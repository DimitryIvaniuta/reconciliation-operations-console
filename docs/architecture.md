# Frontend architecture

## Design goals

1. Expose every public backend workflow without inventing unsupported APIs.
2. Keep the production backend API key outside browser JavaScript.
3. Make mismatch evidence understandable and actionable for an operator.
4. Preserve backend audit identities and correlation IDs throughout the UI.
5. Keep server state deterministic and avoid duplicating it in client stores.
6. Cancel obsolete reads and keep route/startup bundles bounded.
7. Require explicit confirmation before state-repair operations.

## Layers

- `src/api`: bounded fetch client, runtime-validated backend contracts, query keys.
- `src/auth`: proxy/session authentication boundary.
- `src/app`: route registry, lazy boundaries, query policy, providers.
- `src/components`: reusable layout, feedback, chart, dialog, and form primitives.
- `src/features`: route-level business workflows.
- `src/hooks`: API context, online state, document titles, replay navigation history.
- `src/types`: exact public backend response models.
- `src/utils`: date, amount, count, quick-open, and UUID helpers.

## Loading and state model

Every feature page is a lazy route chunk. Sidebar focus/hover triggers intent prefetch, and the dashboard chart is loaded only when its metrics panel renders. The build manifest and gzip budgets prevent accidental eager-loading regressions.

TanStack Query owns remote state and passes cancellation signals to the HTTP client. React Hook Form owns transient form state. URL search parameters own report filters and metric dates. The only persistent browser value is a bounded list of recently viewed replay UUIDs. The development API key is session-scoped.

## Production request path

```text
Browser -> same-origin /api -> nginx policy checks -> X-API-Key injection -> Spring WebFlux backend
Browser -> exact /actuator/health -> nginx -> Spring Actuator
```

nginx rejects cross-site Fetch Metadata, unsupported methods, and non-JSON POSTs before attaching the service credential. It strips browser authorization/cookies and backend cookie/server headers. This avoids production CORS and keeps the deployment secret out of compiled JavaScript, runtime config, browser storage, and application request construction.

The console must additionally be protected by an authenticated enterprise access gateway or private network perimeter because the backend API key represents the frontend service, not an individual operator.

## Error and contract handling

The HTTP client:

- applies a 30-second timeout;
- propagates caller cancellation;
- rejects redirects and cross-origin targets;
- sends `Accept: application/json` and a fresh correlation ID;
- incrementally enforces success/error body ceilings;
- retains response correlation IDs and bounded `Retry-After` guidance;
- never logs headers or response bodies.

Zod validates every successful response and rejects inconsistent evidence, including invalid partition ranges, Kafka totals that do not equal offset evidence, mismatch reports without actions, and replay checkpoints outside their bounded offsets.

## Backend limitation intentionally preserved

There is no `GET /api/v1/replays` endpoint. The frontend does not simulate one. Recent replay identifiers are local navigation shortcuts only and are clearly labeled as such.
