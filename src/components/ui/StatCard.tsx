import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  caption,
  icon,
  trend,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  trend?: ReactNode;
}) {
  return (
    <article className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        <span className="stat-card__caption">{caption}</span>
      </div>
      {trend && <div className="stat-card__trend">{trend}</div>}
    </article>
  );
}
