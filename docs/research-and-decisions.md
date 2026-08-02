# Research and production decisions

Research was refreshed on 19 July 2026 against official project documentation, current security notices, and the backend source archive.

## Selected platform

| Concern | Selection | Reason |
|---|---|---|
| UI runtime | React 19.2.7 | Current patched React 19.2 dependency selected for a browser-only operations console. |
| Language | TypeScript 7.0.2 | Current stable line with exact optional types, unchecked-index protection, and strict project references. |
| Build | Vite 8.1.5 | Supported Vite 8.1 line with the unified Rolldown build pipeline. |
| Routing | React Router 8.2.0 | Current ESM router baseline; route modules are lazy loaded and intent-prefetched. |
| Server state | TanStack Query 5.101.2 | Remote-state ownership, cancellation, reconnect behavior, bounded retries, and invalidation. |
| Forms/contracts | React Hook Form + Zod | Efficient controlled workflows and runtime validation of both input and backend evidence. |
| Quality | Biome 2.5.4, TypeScript, Vitest | Deterministic formatting/lint plus strict static and behavioral gates. |
| Browser tests | Playwright 1.61.1 + axe-core 4.12.1 | Production-bundle journeys and WCAG scans using the browser accessibility tree. |
| Build runtime | Node.js 24.18.0 LTS | Latest Node 24 LTS release at the audit date; used by `.nvmrc`, Docker, and CI. |
| Web runtime | nginx 1.30.4 stable | Security-patched stable release published 15 July 2026. |

Official references:

- React versions and React 19.2: https://react.dev/versions and https://react.dev/blog/2025/10/01/react-19-2
- Vite releases and Vite 8: https://vite.dev/releases and https://vite.dev/blog/announcing-vite8
- React Router installation and v8 upgrades: https://reactrouter.com/start/declarative/installation and https://reactrouter.com/upgrading/v7
- Node.js 24.18.0 LTS: https://nodejs.org/en/blog/release/v24.18.0
- TanStack Query cancellation: https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- nginx downloads and security advisories: https://nginx.org/en/download.html and https://nginx.org/en/security_advisories.html
- GitHub CodeQL: https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql

## Backend contract analysis

The UI was derived from the backend controllers and public records rather than guessed endpoints. It implements:

- business-event publication;
- daily metrics retrieval;
- manual reconciliation execution;
- reconciliation report filtering and detail;
- replay creation, lookup, checkpoints, and explicit retry;
- exact Actuator health access.

The backend has no replay-list endpoint. The frontend therefore keeps only a bounded list of recently opened replay UUIDs for navigation. It never represents that browser history as authoritative job data.

## Security boundary

A static SPA cannot safely retain a production service API key. The production image therefore uses nginx as a same-origin reverse proxy:

1. The browser calls only same-origin `/api` and the exact `/actuator/health` path.
2. nginx validates Fetch Metadata, method, and JSON content type before attaching a key.
3. nginx injects `X-API-Key` from deployment configuration and clears browser `Authorization` and `Cookie` headers.
4. Backend cookies and implementation headers are removed from the response.
5. Runtime browser configuration contains no key.
6. The console must still sit behind an authenticated enterprise gateway or private network because the key identifies the frontend service, not an operator.

Local development can use a session-only key. It is deliberately stored in `sessionStorage`, removed on authorization failure, and never written to `localStorage`.

## Data and error integrity

- Every successful backend response is parsed with a Zod schema before entering application state.
- Cross-field checks verify Kafka offset totals, status/action consistency, and bounded replay checkpoint progress.
- Requests use a timeout, reject redirects, send a fresh correlation ID, and do not cache operational responses.
- TanStack Query cancellation reaches Fetch, so obsolete routes do not continue network/parsing work.
- Success and error bodies are read incrementally with byte ceilings even when `Content-Length` is absent or dishonest.
- Runtime API paths stay on the current origin; support links must use HTTPS or a same-origin path.

## Performance decision

Feature pages are route-level lazy chunks, target routes prefetch after explicit pointer/keyboard intent, and the expensive chart dependency stays behind its own boundary. The build emits a manifest and enforces both individual and aggregate gzip budgets, turning performance expectations into a CI failure rather than a documentation promise.

## UI safety and accessibility

The visual structure follows an operations-focused banking console. State-changing repair actions require explicit modal confirmation; dry-run remains the default. Offline state is announced, replay progress uses a native element, navigation supports skip links and keyboard focus, and Playwright/axe scans critical workflows for serious or critical WCAG violations.
