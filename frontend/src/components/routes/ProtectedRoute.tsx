import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "react-bootstrap";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, initialized } = useAuth();

  // Wait for auth initialization
  if (!initialized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Redirect to login if user is null after initialization
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AuthRedirect: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
