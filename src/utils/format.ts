const countFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const amountFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

export function truncateMiddle(value: string, start = 8, end = 6): string {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}
