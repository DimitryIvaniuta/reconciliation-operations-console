# Changelog

## 2.0.0 - 2026-07-19

### Added

- Route-level lazy loading and intent-based prefetching for every operational workspace.
- Deterministic Vite manifest and executable raw/gzip bundle-size budgets.
- Query cancellation propagated from TanStack Query into the Fetch API.
- Incremental response-body limits that stop oversized chunked payloads before they can exhaust browser memory.
- Runtime invariants for Kafka offset evidence, report status/issues, and replay checkpoint bounds.
- Offline-state announcements, a keyboard-accessible skip link, and explicit prefixed quick-open navigation.
- Native confirmation dialogs before projection-repair replays and failed-job retries.
- Validated deployment support links and an optional support action in the footer.
- Playwright plus axe-core checks for critical WCAG workflows.
- CodeQL security-extended analysis and a container-level BFF boundary test in CI.

### Changed

- Upgraded the runtime image to Node.js 24.18.0 LTS and security-patched nginx 1.30.4 stable.
- Hardened nginx to reject cross-site API requests, unsupported methods, and non-JSON POST bodies before proxying.
- Stripped browser authorization/cookie headers and backend cookie/server headers at the reverse-proxy boundary.
- Expanded response security headers with HSTS, Origin-Agent-Cluster, and cross-domain-policy denial.
- Applied bounded retry guidance from `Retry-After` while keeping mutations non-retrying.
- Replaced purely visual replay progress with a native accessible `progress` element.
- Updated GitHub Actions to current major lines and added concurrency cancellation.

### Verified

- Strict TypeScript, Biome, static security checks, unit/component tests, coverage thresholds, production build, bundle budgets, dependency audit, YAML/JSON parsing, shell syntax, nginx syntax, Git integrity, and archive extraction.

## 1.0.0 - 2026-07-19

### Added

- React 19.2 banking-style operations shell with responsive header, sidebar, central workspace, and footer.
- Complete UI for backend event, metrics, reconciliation, report, replay, checkpoint, retry, and health operations.
- Production nginx reverse proxy that keeps the backend API key outside browser JavaScript.
- Strict TypeScript 7 configuration, Biome quality/security rules, and correlation-aware fetch client.
- Vitest component tests and essential Playwright desktop/mobile e2e tests.
- Non-root read-only container, CI, Dependabot, npm audit, and CycloneDX SBOM generation.
