import { useCallback, useState } from "react";

const STORAGE_KEY = "ledgerguard.recentReplayIds";
const MAX_ITEMS = 8;

function readIds(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

/** Tracks non-sensitive replay identifiers because the backend intentionally has no list endpoint. */
export function useRecentReplays() {
  const [ids, setIds] = useState<string[]>(readIds);

  const remember = useCallback((jobId: string) => {
    setIds((current) => {
      const next = [jobId, ...current.filter((id) => id !== jobId)].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* Navigation history is optional. */
      }
      return next;
    });
  }, []);

  const remove = useCallback((jobId: string) => {
    setIds((current) => {
      const next = current.filter((id) => id !== jobId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* Navigation history is optional. */
      }
      return next;
    });
  }, []);

  return { ids, remember, remove };
}
