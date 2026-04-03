import { Component, ErrorInfo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red", backgroundColor: "black", minHeight: "100vh" }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error?.stack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-xl">
      Loading...
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/verify-otp"
            element={
              <PublicOnlyRoute>
                <VerifyOtp />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;