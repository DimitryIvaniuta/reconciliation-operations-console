# Production upgrade report — version 2.0.0

## Audit focus

The review covered application correctness, browser security, API-contract integrity, destructive-operation safety, runtime performance, accessibility, reverse-proxy behavior, supply-chain controls, CI reproducibility, and operational documentation.

## Important findings corrected

1. **Route payloads were eagerly loaded.** All feature pages are now lazy route chunks. Navigation intent prefetches the target chunk on keyboard focus or pointer hover, while the chart library remains isolated behind a second lazy boundary.
2. **Cancelled queries continued consuming network and parsing work.** TanStack Query's `AbortSignal` now reaches the Fetch API for every read request.
3. **Response size checks trusted `Content-Length` or checked only after `response.text()`.** The client now reads streams incrementally and cancels the body as soon as the byte ceiling is crossed, including chunked responses.
4. **TypeScript types alone could not protect against semantically inconsistent backend evidence.** Zod refinements now validate partition ranges, Kafka totals, status/issue consistency, and replay checkpoint bounds.
5. **Repair actions were one-click operations.** Non-dry-run replay and failed-job retry now require explicit native modal confirmation and remain disabled while the mutation is in flight.
6. **Deployment request filtering relied mainly on backend parsing.** nginx now rejects cross-site requests, unsupported methods, and non-JSON API POSTs before the backend service key is attached.
7. **Browser credentials and cookies could be forwarded accidentally.** The BFF clears inbound `Authorization` and `Cookie`, injects only its configured API key, and removes `Set-Cookie`, `Server`, and `X-Powered-By` from backend responses.
8. **Bundle growth had no executable gate.** The build emits a manifest and fails when raw/gzip JavaScript, CSS, or individual chunk budgets are exceeded.
9. **Accessibility was linted but not scanned in a browser.** Critical workflows now have axe-core Playwright checks in addition to semantic component rules and keyboard navigation.
10. **Security analysis did not include source-level data-flow scanning.** CodeQL runs on pushes, pull requests, and a weekly schedule using `security-extended` queries.

## Resulting architecture

```text
Operator browser
  -> React 19.2 route shell
     -> lazy operational feature chunk
     -> TanStack Query cancellation/retry policy
     -> bounded same-origin HTTP client
  -> nginx same-origin BFF
     -> method/content-type/fetch-metadata checks
     -> server-side X-API-Key injection
     -> Spring WebFlux reconciliation backend
```

## Build budget

The release build enforces:

- total JavaScript raw size: at most 1,250,000 bytes;
- total JavaScript gzip size: at most 350,000 bytes;
- largest JavaScript chunk gzip size: at most 150,000 bytes;
- total CSS gzip size: at most 45,000 bytes;
- no production source maps;
- required Vite manifest.

These ceilings are deliberately above the current output but low enough to catch accidental eager imports and major dependency regressions.

## Deferred by backend contract

The backend still exposes no replay-list endpoint and no human-identity/OIDC contract. The UI therefore continues to:

- treat recent replay IDs only as local navigation shortcuts;
- require an enterprise access gateway or private network perimeter in production;
- avoid inventing user/role administration that the backend cannot enforce.
