import { appConfig } from "../../config/runtime-config";

export function Footer() {
  return (
    <footer className="footer">
      <span>LedgerGuard Operations Console</span>
      <span className="footer__meta">
        <span>Immutable evidence · Idempotent replay · Correlated requests</span>
        {appConfig.supportUrl && (
          <a href={appConfig.supportUrl} target="_blank" rel="noopener noreferrer">
            Help &amp; support
          </a>
        )}
      </span>
    </footer>
  );
}
