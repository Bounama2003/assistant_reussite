import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { Menu, HelpCircle } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';
import GuideDrawer from '@/components/ui/GuideDrawer';
import { getInitials } from '@/lib/utils';

export default function Header() {
  const { role, student, professor } = useAuthStore();
  const { sidebarOpen, toggleSidebar, guideOpen, setGuideOpen } = useAppStore();

  const userDisplayName = student?.name || professor?.name || '';

  return (
    <>
      <header
        className={`fixed top-0 h-16 glass border-b border-nuit-600/50 z-[70] flex items-center justify-between px-4 sm:px-6 transition-all duration-300 left-0 right-0 ${sidebarOpen ? 'lg:left-[260px]' : 'lg:left-[72px]'}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/5 text-nuit-200 lg:hidden active:scale-95 touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationBell />
          <button
            onClick={() => setGuideOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/5 text-nuit-200 hover:text-white transition-colors active:scale-95 touch-manipulation"
            aria-label="Aide"
          >
            <HelpCircle size={18} />
          </button>

          {userDisplayName && (
            <div className="flex items-center gap-2 pl-2 border-l border-nuit-600/50">
              <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-gradient-to-br from-emeraude-400 to-emeraude-600 active:scale-95 touch-manipulation" aria-label="Profil">
                <span className="text-xs font-bold text-white">{getInitials(userDisplayName)}</span>
              </button>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-medium text-white leading-tight truncate max-w-[150px]">{userDisplayName}</p>
                <p className="text-xs text-nuit-200 capitalize truncate">{role}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
