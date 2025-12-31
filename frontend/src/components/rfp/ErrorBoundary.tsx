//
// Error Boundary for Questions Management
//

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert } from "react-bootstrap";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Alert variant="danger" className="m-3">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

