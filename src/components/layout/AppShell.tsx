import { useState } from "react";
import { Outlet } from "react-router";
import { NetworkStatus } from "../feedback/NetworkStatus";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header onMenu={() => setMobileOpen((open) => !open)} />
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="app-main" id="main-content" tabIndex={-1}>
        <NetworkStatus />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
