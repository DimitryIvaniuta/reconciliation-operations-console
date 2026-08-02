import { CloudOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/use-online-status";

/** Announces offline mode while allowing cached query data to remain visible. */
export function NetworkStatus() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="network-banner" role="status" aria-live="polite">
      <CloudOff size={17} aria-hidden="true" />
      <span>You are offline. Live reads and operator actions will resume after reconnection.</span>
    </div>
  );
}
