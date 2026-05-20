import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '@/components/ui/ToastContainer';
import OnboardingModal from '@/components/ui/OnboardingModal';
import GuideModal from '@/components/ui/GuideModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

const SIDEBAR_OPEN = 260;
const SIDEBAR_CLOSED = 72;

export default function AppLayout() {
  const { role } = useAuthStore();
  const { sidebarOpen, guideOpen, setGuideOpen } = useAppStore();
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
      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <Sidebar />
      <Header
        sidebarWidth={sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED}
      />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-[260px]' : 'ml-[72px]'
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
