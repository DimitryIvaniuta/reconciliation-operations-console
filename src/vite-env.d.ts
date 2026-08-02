/// <reference types="vite/client" />

type AuthMode = "proxy" | "session";

interface RuntimeAppConfig {
  apiBaseUrl: string;
  healthBaseUrl: string;
  authMode: AuthMode;
  environment: string;
  supportUrl?: string;
}

interface Window {
  __APP_CONFIG__?: Partial<RuntimeAppConfig>;
}
