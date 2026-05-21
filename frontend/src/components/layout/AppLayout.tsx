import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '@/components/ui/ToastContainer';
import OnboardingModal from '@/components/ui/OnboardingModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { role } = useAuthStore();
  const { sidebarOpen } = useAppStore();
  const isAuth = role !== null && role !== 'lead';
  usePushNotifications(isAuth);

  if (role === null || role === 'lead') {
    return (
      <main className="min-h-screen bg-nuit-900">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-900 overflow-x-hidden">
      <ToastContainer />
      <OnboardingModal />
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ml-0',
          sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'
        )}
      >
        <div className="page-container">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
