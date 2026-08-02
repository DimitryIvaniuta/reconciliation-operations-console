import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, LogOut, Server, ShieldCheck } from "lucide-react";
import { queryKeys } from "../../api/query-keys";
import { reconciliationApi } from "../../api/reconciliation-api";
import { useAuth } from "../../auth/auth-context";
import { ErrorState, LoadingState } from "../../components/feedback/AsyncState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { appConfig } from "../../config/runtime-config";
import { useApiContext } from "../../hooks/use-api-context";
import { useDocumentTitle } from "../../hooks/use-document-title";

export function SettingsPage() {
  useDocumentTitle("Settings");
  const context = useApiContext();
  const { clearApiKey } = useAuth();
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => reconciliationApi.health(context, signal),
  });

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="Connection & security"
        title="Settings"
        description="Review runtime endpoints and the active credential delivery model."
      />
      <div className="dashboard-grid">
        <Card title="Backend connection" subtitle="Runtime values are injected at deployment time">
          <dl className="identity-list">
            <div>
              <dt>API base URL</dt>
              <dd>
                <code>{appConfig.apiBaseUrl}</code>
              </dd>
            </div>
            <div>
              <dt>Health base URL</dt>
              <dd>
                <code>{appConfig.healthBaseUrl}</code>
              </dd>
            </div>
            <div>
              <dt>Environment</dt>
              <dd>{appConfig.environment}</dd>
            </div>
          </dl>
          {health.isLoading ? (
            <LoadingState label="Testing connection" />
          ) : health.isError ? (
            <ErrorState error={health.error} retry={() => health.refetch()} />
          ) : (
            <div className="success-panel">
              <CheckCircle2 />
              <div>
                <h3>Backend is {health.data?.status}</h3>
                <p>The health endpoint responded successfully.</p>
              </div>
            </div>
          )}
        </Card>
        <Card
          title="Credential model"
          subtitle={
            appConfig.authMode === "proxy"
              ? "Recommended production mode"
              : "Local development mode"
          }
        >
          <div className="security-mode">
            {appConfig.authMode === "proxy" ? <ShieldCheck /> : <KeyRound />}
            <div>
              <h3>
                {appConfig.authMode === "proxy"
                  ? "Server-side reverse proxy"
                  : "Session-only browser key"}
              </h3>
              <p>
                {appConfig.authMode === "proxy"
                  ? "The nginx container injects the backend API key. Browser JavaScript never receives it."
                  : "The API key is held in sessionStorage and is removed when the browser session ends."}
              </p>
            </div>
          </div>
          {appConfig.authMode === "session" && (
            <Button variant="danger" onClick={clearApiKey} icon={<LogOut size={17} />}>
              End secure session
            </Button>
          )}
        </Card>
      </div>
      <Card title="Deployment controls">
        <div className="control-list">
          <div>
            <Server />
            <div>
              <strong>Same-origin API proxy</strong>
              <p>
                Avoids production CORS configuration and prevents cross-origin credential
                forwarding.
              </p>
            </div>
          </div>
          <div>
            <ShieldCheck />
            <div>
              <strong>Strict browser policy</strong>
              <p>
                Content Security Policy, clickjacking protection, MIME sniffing prevention, and
                restrictive permissions policy are set by nginx.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
