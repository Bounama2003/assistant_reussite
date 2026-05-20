import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { Menu, HelpCircle } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  sidebarWidth: number;
}

export default function Header({ sidebarWidth }: HeaderProps) {
  const { role, student, professor } = useAuthStore();
  const { toggleSidebar, setGuideOpen } = useAppStore();

  const userDisplayName = student?.name || professor?.name || '';

  return (
    <header
      className="fixed top-0 h-16 glass border-b border-nuit-600/50 z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300"
      style={{ left: sidebarWidth, right: 0 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-nuit-300 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <button onClick={() => setGuideOpen(true)} className="p-2 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors" aria-label="Aide">
          <HelpCircle size={18} />
        </button>

        {userDisplayName && (
          <div className="flex items-center gap-3 pl-3 border-l border-nuit-600/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {getInitials(userDisplayName)}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-white leading-tight truncate max-w-[150px]">{userDisplayName}</p>
              <p className="text-xs text-nuit-400 capitalize truncate">{role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
