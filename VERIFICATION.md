# Verification record

Verified on 19 July 2026 in the provided build environment.

## Completed checks

### Dependency and lockfile integrity

The package and lockfile both identify release `2.0.0`. A clean install path is defined by `npm ci`, exact dependency versions, `engine-strict=true`, Node.js `24.18.0` in `.nvmrc`, and the same Node line in Docker/CI.

The local runner provides Node.js 22.16.0, below the project's and React Router 8.2.0's Node.js 22.22 minimum. Engine enforcement was disabled only for local verification commands; the repository, Docker build, and CI retain the production engine requirement.

### Static and compiler gate

```text
npm run check
```

Passed:

- custom repository/security verifier over 65 source files;
- Biome formatting, lint, accessibility, and suspicious-code checks over 85 files;
- strict TypeScript project compilation.

### Unit and component tests

```text
npm test
```

Passed: **12 test files, 29 tests**.

The added coverage includes caller cancellation, `Retry-After`, declared and chunked body ceilings, cross-field reconciliation evidence, runtime support URL protocols, prefixed quick-open validation, and confirmation before non-dry-run replay.

### Coverage gate

```text
npm run test:coverage
```

Passed enforced core-logic thresholds:

- statements: **87.60%**;
- branches: **75.29%**;
- functions: **91.83%**;
- lines: **90.29%**.

Page composition and responsive journeys remain Playwright responsibilities rather than being artificially inflated into unit coverage.

### Production build and performance budget

```text
npm run build
```

Passed with Vite 8.1.5 and a deterministic manifest. The build emitted 28 measured JavaScript/CSS artifacts, no source maps, and passed the executable limits:

- JavaScript raw: **852,955 bytes** / 1,250,000 maximum;
- JavaScript gzip: **260,200 bytes** / 350,000 maximum;
- largest chunk gzip: **103,960 bytes** / 150,000 maximum;
- CSS gzip: **5,409 bytes** / 45,000 maximum.

All feature workspaces are route-level lazy chunks. Recharts remains isolated in a separate chart chunk and is not part of the initial application module.

### Dependency and supply-chain review

Both audits returned zero known vulnerabilities:

```text
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

A CycloneDX SBOM was generated and parsed successfully. GitHub Actions additionally runs CodeQL `security-extended`, Dependabot, artifact generation, and the same lockfile build.

### Runtime and proxy checks

Passed:

- POSIX shell syntax;
- safe runtime configuration generation and JavaScript parsing;
- no backend API key in browser runtime configuration;
- rejection of unsafe backend URL and `javascript:` support URL input;
- nginx syntax after exact environment substitution;
- cross-site Fetch Metadata, method, and JSON content-type policy in configuration;
- browser authorization/cookie stripping and backend cookie/server-header removal;
- exact health-route exposure and denial of other Actuator routes;
- non-root/read-only/capability-free container settings;
- JSON and YAML parsing for all project configuration assets.

CI builds and starts the final image, then asserts `200` health, `405` unsupported methods, `415` non-JSON POSTs, `403` cross-site API access, and `404` non-health Actuator access.

## End-to-end suite

Five Playwright specification files discover **22 desktop/mobile project cases**. Intentional project-specific skips avoid duplicating the desktop axe scan in the mobile project and reserve the drawer assertion for mobile. Coverage includes:

- authentication and session-only credentials;
- dashboard evidence and report navigation;
- desktop/mobile responsive layout;
- event validation/publication and security headers;
- manual reconciliation;
- replay idempotency and checkpoints;
- axe-core serious/critical WCAG checks for four critical workspaces.

The e2e TypeScript sources compile and the complete inventory is discovered correctly. Local browser execution could not be completed because the only installed Chromium is governed by an administrator policy that returns `ERR_BLOCKED_BY_ADMINISTRATOR` for `127.0.0.1`; official Playwright browser download is unavailable from the shell network. No attempt was made to bypass that policy. GitHub Actions installs Playwright-managed Chromium and runs the desktop suite on Node.js 24.

## Local environment limitation

Docker is not installed locally. The image could not be built here, but Dockerfile/Compose inputs, entrypoint behavior, nginx syntax, security policies, and the CI container smoke workflow were all validated. CI performs the actual image build and runtime HTTP assertions.
