import { Component } from "react";

/**
 * Keeps a runtime error from leaving the whole app as a blank page (which is
 * especially confusing on mobile, where console access is limited).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("CloudSpaceChat crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <img
            src={import.meta.env.BASE_URL + "csclogo.png"}
            alt="CloudSpaceChat"
            className="crash-logo"
          />
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || "The app hit an unexpected error."}</p>
          <div className="crash-actions">
            <button type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                localStorage.removeItem("csc_settings");
                window.location.reload();
              }}
            >
              Clear cache &amp; reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
