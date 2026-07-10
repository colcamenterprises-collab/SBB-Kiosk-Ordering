import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("SBB kiosk screen crashed", error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="kiosk-error-shell">
        <section className="kiosk-error-card">
          <span>Smash Brothers Burgers</span>
          <h1>Screen recovered</h1>
          <p>
            The kiosk hit a display error instead of going blank. You can restart this screen and keep testing.
          </p>
          <code>{this.state.error.message || "Unknown kiosk error"}</code>
          <div>
            <button onClick={this.reset}>Try Again</button>
            <button onClick={() => window.location.assign("/kiosk")}>Restart Kiosk</button>
          </div>
        </section>
      </main>
    );
  }
}
