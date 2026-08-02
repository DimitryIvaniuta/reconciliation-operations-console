import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyMetrics } from "../../types/domain";

/** Visual comparison of independently maintained daily counters. */
export function MetricsComparisonChart({ metrics }: { metrics: DailyMetrics }) {
  const data = [
    { name: "Consumed", value: metrics.consumedEventCount },
    { name: "Unique", value: metrics.uniqueEventCount },
    { name: "Database", value: metrics.databaseRecordCount },
    { name: "Aggregate", value: metrics.aggregateRecordCount },
  ];

  return (
    <div className="chart" role="img" aria-label="Daily reconciliation count comparison">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(11,31,58,.04)" }} />
          <Bar dataKey="value" fill="var(--chart-primary)" radius={[7, 7, 2, 2]} maxBarSize={52} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
