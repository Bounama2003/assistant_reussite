import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const redirectMap: Record<string, string> = {
  student: '/dashboard',
  professor: '/professor/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/schools',
};

export default function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { role } = useAuthStore();

  if (role && redirectMap[role]) {
    return <Navigate to={redirectMap[role]} replace />;
  }

  return <>{children}</>;
}
