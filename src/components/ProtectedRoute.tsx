
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const location = useLocation();
  const normalizedRole = (currentUser?.role || '').toLowerCase();
  const hasAdminAccess = normalizedRole === 'admin' || normalizedRole === 'super_admin';

  // Don't make any decisions while still loading
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
  }

  // For routes that require authentication
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page and remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // For routes that require admin access
  if (requireAdmin && (!isAuthenticated || !hasAdminAccess)) {
    // If user is authenticated but not admin, redirect to dashboard
    // If not authenticated at all, the above condition will redirect to login
    return <Navigate to="/dashboard" replace />;
  }

  // For routes that should not be accessed when authenticated (like login page)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
