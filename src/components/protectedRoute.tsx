import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const isTokenExpired = (token: string) => {
  try {
    if (!token.includes(".")) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload || !payload.exp) return false;
    const expiry = payload.exp * 1000; // convert to ms
    return Date.now() > expiry;
  } catch {
    return false; // Trust opaque tokens until the backend rejects with 401
  }
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");

  // ❌ No token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Expired token
  if (isTokenExpired(token)) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // ✅ Valid token
  return <>{children}</>;
};

export default ProtectedRoute;