import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  hasError: boolean;
}

/** Last-resort UI boundary that avoids rendering internal exception details to operators. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Production deployments should connect this boundary to an approved telemetry sink.
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <h1>LedgerGuard could not render this page</h1>
          <p>Reload the page. If the problem persists, contact the operations team.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
