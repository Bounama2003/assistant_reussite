import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type AuthRole } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles: AuthRole[];
  fallback?: string;
}

export default function ProtectedRoute({ children, roles, fallback }: ProtectedRouteProps) {
  const { role } = useAuthStore();
  const location = useLocation();

  // Not logged in at all
  if (!role) {
    return <Navigate to={fallback || '/'} state={{ from: location }} replace />;
  }

  // Logged in but wrong role
  if (!roles.includes(role)) {
    // Redirect to the user's appropriate dashboard
    const redirectMap: Record<string, string> = {
      student: '/dashboard',
      professor: '/professor/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/superadmin/schools',
    };
    return <Navigate to={redirectMap[role] || '/'} replace />;
  }

  return <>{children}</>;
}
