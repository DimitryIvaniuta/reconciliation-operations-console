# Testing strategy

## Static and compiler gates

- strict TypeScript project references;
- Biome formatting, lint, accessibility, and suspicious-code rules;
- custom repository checks for route coverage, API-key storage, unsafe HTML/eval, deployment headers, exact dependency pins, source maps, and unfinished markers;
- YAML, JSON, shell, nginx, and archive validation during release preparation.

## Unit and component tests

Vitest and Testing Library cover:

- correlation and API-key request headers;
- cross-origin blocking, cancellation, timeout-safe errors, `Retry-After`, and incremental body limits;
- Zod response contracts and cross-field evidence invariants;
- session-only credential storage;
- runtime URL validation, including support-link protocol controls;
- operational format and identifier helpers;
- event validation and publication;
- reconciliation execution and report navigation;
- replay idempotency metadata, local history, and destructive-operation confirmation;
- dashboard integration of health, metrics, and reports.

Coverage is enforced on security, transport, contract, configuration, and state helpers. Page composition and responsive navigation are covered in Playwright instead of being artificially inflated in unit tests.

## End-to-end tests

Playwright runs against the built production bundle with deterministic route interception. Desktop and mobile projects verify:

- session-only local-development authentication;
- dashboard evidence and report detail;
- responsive navigation without horizontal overflow;
- event payload and security headers;
- client-side rejection of malformed JSON;
- manual reconciliation result flow;
- replay idempotency and requested-by headers;
- durable checkpoint presentation;
- serious/critical WCAG violations on critical desktop workflows using axe-core.

The test sources do not require a running backend. CI installs Playwright-managed Chromium, while a separate deployment smoke test can point the same image at a live backend.

## Container boundary tests

GitHub Actions builds and starts the final read-only, capability-free image, then asserts:

- `/healthz` is reachable;
- unsupported API methods return `405`;
- non-JSON API POSTs return `415`;
- cross-site Fetch Metadata is rejected with `403`;
- non-health Actuator routes return `404`.
