import { clsx } from "clsx";
import {
  Activity,
  BarChart3,
  DatabaseZap,
  FileSearch,
  Gauge,
  RotateCcw,
  Send,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router";
import { preloadRoute } from "../../app/routes";

const navigation = [
  { to: "/", label: "Overview", icon: Gauge, end: true },
  { to: "/events", label: "Event ingestion", icon: Send },
  { to: "/metrics", label: "Daily metrics", icon: BarChart3 },
  { to: "/reconciliations", label: "Run reconciliation", icon: DatabaseZap },
  { to: "/reports", label: "Reports", icon: FileSearch },
  { to: "/replays", label: "Replay & backfill", icon: RotateCcw },
];

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside className={clsx("sidebar", mobileOpen && "sidebar--open")}>
      <nav aria-label="Primary navigation" className="sidebar__nav">
        <p className="sidebar__section-label">Operations</p>
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(end)}
            onClick={onNavigate}
            onMouseEnter={() => preloadRoute(to)}
            onFocus={() => preloadRoute(to)}
            className={({ isActive }) => clsx("sidebar__link", isActive && "sidebar__link--active")}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__bottom">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          onMouseEnter={() => preloadRoute("/settings")}
          onFocus={() => preloadRoute("/settings")}
          className={({ isActive }) => clsx("sidebar__link", isActive && "sidebar__link--active")}
        >
          <Settings size={19} aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
        <div className="sidebar__status">
          <Activity size={16} aria-hidden="true" />
          <span>Audited operations</span>
        </div>
      </div>
    </aside>
  );
}
