import { format, isValid, parseISO, subDays } from "date-fns";

/** Returns a local calendar date suitable for backend UTC-day query forms. */
export function todayDateInput(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Returns yesterday, the most common completed reconciliation date. */
export function yesterdayDateInput(): string {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

/** Formats an ISO instant using the operator's locale while preserving empty values. */
export function formatInstant(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy HH:mm:ss") : "Invalid date";
}

/** Formats an ISO date without introducing a timezone conversion. */
export function formatBusinessDate(value: string): string {
  const parsed = parseISO(`${value}T00:00:00`);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}
