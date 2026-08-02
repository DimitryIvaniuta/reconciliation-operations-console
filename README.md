# LedgerGuard Reconciliation Operations Console

Production-grade React operations UI for the `reconciliation-data-quality-pipeline` backend. It provides an auditable banking-style workspace for Kafka event ingestion, daily database metrics, reconciliation reports, and durable replay/backfill jobs.

## Stack

- React 19.2.7
- TypeScript 7.0.2 in strict mode
- Vite 8.1.5
- React Router 8.2
- TanStack Query 5.101
- React Hook Form and Zod
- Recharts
- Biome 2.5
- Vitest and Testing Library
- Playwright 1.61 with axe-core
- nginx 1.30.4 same-origin reverse proxy

## Capabilities

| Area | Frontend capability | Backend endpoint |
|---|---|---|
| Overview | Health, completed-day position, latest evidence | `/actuator/health`, daily metrics, reports |
| Event ingestion | Validated business event and attributes editor | `POST /api/v1/events` |
| Daily metrics | Independent count and amount comparisons | `GET /api/v1/daily-metrics/{date}` |
| Reconciliation | Manual immutable report creation | `POST /api/v1/reconciliations/{date}/runs` |
| Reports | Date/status search, evidence and issue detail | `GET /api/v1/reconciliations` |
| Replay/backfill | Dry-run or repair request | `POST /api/v1/replays` |
| Replay monitoring | Lifecycle, progress, checkpoints, retry | replay status/checkpoint/retry endpoints |
| Settings | Connection health and credential mode | runtime configuration |

The backend does not expose a replay-list endpoint. The console therefore stores only recently opened replay UUIDs as non-sensitive local navigation history; all job state is always read from the backend.

## Local development

Requirements: Node.js 24 LTS and npm 11+.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:4200`. Enter the backend API key when prompted. In development it is stored only in `sessionStorage`, never `localStorage`.

Vite proxies `/api` and `/actuator` to `VITE_BACKEND_PROXY_TARGET`, which defaults to `http://localhost:8080`.

## Production container

The production container does **not** expose the API key to browser JavaScript. nginx injects `X-API-Key` while proxying same-origin `/api` requests.

The console is an administrative surface. Deploy it behind an authenticated enterprise access gateway (OIDC/OAuth2, VPN, or equivalent) and do not expose it anonymously to the public internet. The backend API key authenticates the frontend service to the backend; it is not an end-user identity mechanism.

```bash
export BACKEND_API_URL=http://host.docker.internal:8080
export BACKEND_API_KEY='replace-with-a-secret'
docker compose up --build
```

Open `http://localhost:4200`.

Required production variables:

- `BACKEND_API_URL`
- `BACKEND_API_KEY`

Optional variables:

- `APP_ENVIRONMENT`
- `APP_SUPPORT_URL`

## Verification

```bash
npm run check
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:accessibility
npm audit --audit-level=high
```

The production build emits a Vite manifest and enforces raw/gzip bundle budgets. CI additionally runs CodeQL and starts the final hardened container to verify method, content-type, Fetch Metadata, health, and Actuator boundaries.

The aggregate command is:

```bash
npm run verify
```

## Security model

- Production API credentials are injected only by nginx.
- Development credentials are session-scoped.
- Requests use same-origin credentials and reject redirects.
- Every API request receives a fresh correlation ID.
- Fetch calls propagate cancellation and incrementally enforce bounded success/error bodies.
- Arbitrary HTML rendering and `dangerouslySetInnerHTML` are prohibited by Biome.
- Runtime configuration contains no backend secret.
- nginx enforces method/content-type/Fetch Metadata policy, strips browser credentials, and sets CSP, HSTS, frame, MIME, permissions, COOP, and CORP controls.
- The runtime container is non-root, read-only, capability-free, and uses `no-new-privileges`.
- CI runs type checking, linting, coverage, bundle budgets, Playwright/axe, container boundary tests, CodeQL, dependency audit, and SBOM generation.

See [SECURITY.md](SECURITY.md), [docs/architecture.md](docs/architecture.md), [docs/production-upgrade-v2.md](docs/production-upgrade-v2.md), [docs/research-and-decisions.md](docs/research-and-decisions.md), and [VERIFICATION.md](VERIFICATION.md).

## Repository

Suggested GitHub repository:

- **Name:** `reconciliation-operations-console`
- **Description:** `React 19 operations console for Kafka/PostgreSQL reconciliation, immutable data-quality reporting, and resumable replay management.`

Publishing instructions are in [REPOSITORY.md](REPOSITORY.md).
