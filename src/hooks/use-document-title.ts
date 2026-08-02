import { useEffect } from "react";

/** Keeps browser history understandable for operators and assistive technology. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · LedgerGuard Operations`;
  }, [title]);
}
