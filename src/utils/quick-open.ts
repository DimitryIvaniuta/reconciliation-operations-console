import { isUuid } from "./ids";

export type QuickOpenTarget = { kind: "report" | "replay"; id: string };

/** Parses explicit report/replay references so an identifier is never routed to the wrong API. */
export function parseQuickOpen(value: string): QuickOpenTarget | null {
  const match = /^(report|replay):\s*(.+)$/i.exec(value.trim());
  if (!match) return null;
  const kind = match[1]?.toLowerCase();
  const id = match[2]?.trim();
  if ((kind !== "report" && kind !== "replay") || !id || !isUuid(id)) return null;
  return { kind, id };
}
