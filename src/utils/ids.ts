const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Uses the browser cryptographic generator for idempotency and event identifiers. */
export function createUuid(): string {
  return crypto.randomUUID();
}

/** Validates UUID route and quick-open identities before they can reach the backend. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
