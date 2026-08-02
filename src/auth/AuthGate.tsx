import { KeyRound, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "../components/ui/Button";
import { FieldShell, Input } from "../components/ui/FormField";
import { appConfig } from "../config/runtime-config";
import { useAuth } from "./auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, setApiKey } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  if (authenticated) return children;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim().length < 8) {
      setError("Enter the API key provided by your backend deployment.");
      return;
    }
    setApiKey(value);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__brand">
          <ShieldCheck aria-hidden="true" />
        </div>
        <p className="page-header__eyebrow">Secure operator access</p>
        <h1>Connect to LedgerGuard</h1>
        <p>The key is kept only for this browser session and is never written to local storage.</p>
        <form onSubmit={submit} className="auth-form">
          <FieldShell
            label="Backend API key"
            htmlFor="api-key"
            error={error}
            hint={`Target: ${appConfig.apiBaseUrl}`}
          >
            <Input
              id="api-key"
              type="password"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              autoComplete="current-password"
              spellCheck={false}
            />
          </FieldShell>
          <Button type="submit" icon={<KeyRound size={18} />}>
            Start secure session
          </Button>
        </form>
      </section>
    </main>
  );
}
