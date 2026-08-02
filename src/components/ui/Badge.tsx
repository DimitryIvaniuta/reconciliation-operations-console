import { clsx } from "clsx";
import type { ReactNode } from "react";

interface BadgeProps {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={clsx("badge", `badge--${tone}`)}>{children}</span>;
}
