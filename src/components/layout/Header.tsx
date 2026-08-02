import { Bell, Menu, Search, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { appConfig } from "../../config/runtime-config";
import { parseQuickOpen } from "../../utils/quick-open";

export function Header({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState("");

  const submitQuickOpen = (event: FormEvent) => {
    event.preventDefault();
    const target = parseQuickOpen(quickOpen);
    if (!target) {
      toast.error("Use report:<UUID> or replay:<UUID>");
      return;
    }
    navigate(`/${target.kind === "report" ? "reports" : "replays"}/${target.id}`);
    setQuickOpen("");
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" onClick={onMenu} aria-label="Open navigation">
        <Menu aria-hidden="true" />
      </button>
      <div className="brand">
        <span className="brand__mark">
          <ShieldCheck aria-hidden="true" />
        </span>
        <span className="brand__text">
          <strong>LedgerGuard</strong>
          <small>Operations</small>
        </span>
      </div>
      <search className="topbar__search-shell">
        <form className="topbar__search" onSubmit={submitQuickOpen}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Open report or replay by prefixed identifier"
            placeholder="report:UUID or replay:UUID"
            value={quickOpen}
            onChange={(event) => setQuickOpen(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="topbar__search-submit" aria-label="Open identifier">
            Open
          </button>
        </form>
      </search>
      <div className="topbar__actions">
        <span className="environment-pill">{appConfig.environment}</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Open mismatch reports"
          title="Open mismatch reports"
          onClick={() => navigate("/reports?status=MISMATCH")}
        >
          <Bell aria-hidden="true" />
        </button>
        <button
          type="button"
          className="avatar"
          onClick={() => navigate("/settings")}
          aria-label="Open connection settings"
        >
          OP
        </button>
      </div>
    </header>
  );
}
