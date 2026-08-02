# Contributing

1. Use Node.js 24 LTS.
2. Create a focused branch from `main`.
3. Keep backend contracts in `src/types/domain.ts` aligned with the Java records.
4. Add component tests for validation and state transitions.
5. Add or update Playwright coverage for operator workflows.
6. Run `npm run verify` and `npm audit --audit-level=high` before opening a pull request.
7. Do not add persistent authentication tokens or arbitrary HTML rendering.

Use Conventional Commits, for example:

```text
feat(reports): add partition evidence export
fix(auth): clear session key after unauthorized response
```
