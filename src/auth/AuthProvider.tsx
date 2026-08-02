import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { appConfig } from "../config/runtime-config";
import { AuthContext } from "./auth-context";
import { API_KEY_SESSION_STORAGE_KEY, UNAUTHORIZED_EVENT } from "./session";

/**
 * Stores development credentials only in sessionStorage. Production proxy mode never exposes the
 * backend API key to JavaScript and is considered authenticated by deployment configuration.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (appConfig.authMode === "proxy") return null;
    return sessionStorage.getItem(API_KEY_SESSION_STORAGE_KEY);
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      if (appConfig.authMode === "session") {
        sessionStorage.removeItem(API_KEY_SESSION_STORAGE_KEY);
        setApiKeyState(null);
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      apiKey,
      authenticated: appConfig.authMode === "proxy" || Boolean(apiKey),
      setApiKey: (next: string) => {
        const trimmed = next.trim();
        sessionStorage.setItem(API_KEY_SESSION_STORAGE_KEY, trimmed);
        setApiKeyState(trimmed);
      },
      clearApiKey: () => {
        sessionStorage.removeItem(API_KEY_SESSION_STORAGE_KEY);
        setApiKeyState(null);
      },
    }),
    [apiKey],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
