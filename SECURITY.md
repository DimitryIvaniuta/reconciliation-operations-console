# Security policy

## Supported version

The latest release on the `main` branch receives security fixes.

## Reporting

Do not create a public issue for suspected vulnerabilities. Use the repository's private security advisory channel and include impact, affected route, reproduction steps, and browser/runtime versions.

## Credential rules

- Never commit `.env`, backend API keys, captured headers, traces containing credentials, or production runtime configuration.
- Production must use `authMode: proxy` through the supplied nginx image.
- Session mode is intended only for controlled local development.
- Rotate the backend API key immediately after accidental exposure.
- Supply the container key from the deployment platform's secret facility rather than a checked-in Compose file.

## Access boundary

This is a privileged operations console. Production deployment must sit behind an authenticated access gateway or a private network boundary. The nginx-held backend API key is a service credential and must never be treated as end-user authentication. The gateway should strip inbound identity headers, use secure SameSite cookies, apply operator authorization, and restrict access to operations personnel.

## Reverse-proxy boundary

Before attaching the backend service key, nginx:

- rejects `Sec-Fetch-Site: cross-site` API and health traffic;
- permits only GET and POST under `/api`;
- requires `application/json` for API POSTs;
- clears inbound `Authorization`, `Cookie`, and connection-specific headers;
- removes backend `Set-Cookie`, `Server`, and `X-Powered-By` headers;
- exposes only the exact Actuator health route.

## Browser controls

The supplied nginx configuration sets CSP, HSTS, frame denial, MIME sniffing denial, Origin-Agent-Cluster, restrictive permissions, COOP, CORP, and no-store rules for HTML, runtime configuration, API responses, and health data. Hashed assets alone receive immutable caching.

The client constrains runtime service URLs to the current origin, restricts support URLs to HTTPS or same-origin paths, rejects redirects, propagates cancellation, and incrementally bounds response bodies. It never renders arbitrary HTML.

## High-impact operations

Dry-run replay is the default. Projection-repair replay and failed-job retry require explicit confirmation, use backend idempotency semantics, and disable repeat submission while in progress.

## Dependency and source controls

Dependabot monitors npm, Docker, and GitHub Actions. CI fails on high-severity findings, generates a CycloneDX SBOM, executes CodeQL `security-extended` analysis, enforces exact package versions, and validates the final container boundary.
