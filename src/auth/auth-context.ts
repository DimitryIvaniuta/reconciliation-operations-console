import { createContext, useContext } from "react";

export interface AuthState {
  apiKey: string | null;
  authenticated: boolean;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

/** Returns the active authentication state and guards against missing providers. */
export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
