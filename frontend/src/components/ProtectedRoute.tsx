import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/context/AuthContext";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  roles?: Role[];
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
