import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="container"
        style={{ padding: "4rem 1.25rem", textAlign: "center" }}
      >
        <h2>Algo salió mal</h2>
        <p>Recarga la página para continuar.</p>
        <button
          className="btn btn-accent"
          onClick={() => window.location.reload()}
        >
          Recargar
        </button>
      </div>
    );
  }
}
