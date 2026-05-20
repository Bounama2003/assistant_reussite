import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Users,
  Upload,
  BarChart3,
  School,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Bell,
  Brain,
  UserCircle,
  Layers,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore, type AuthRole } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: AuthRole[];
}

const dashboardPaths: Record<string, string> = {
  student: '/dashboard',
  professor: '/professor/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/stats',
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard', roles: ['student', 'professor', 'admin', 'superadmin'] },
  { icon: MessageSquare, label: 'Chat IA', path: '/chat', roles: ['student'] },
  { icon: Brain, label: 'Quiz', path: '/quiz', roles: ['student'] },
  { icon: BookOpen, label: 'Mes sessions', path: '/sessions', roles: ['student'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['student'] },
  { icon: GraduationCap, label: 'Étudiants', path: '/admin/students', roles: ['admin'] },
  { icon: Users, label: 'Leads', path: '/admin/leads', roles: ['admin'] },
  { icon: UserCircle, label: 'Professeurs', path: '/admin/professors', roles: ['admin'] },
  { icon: Layers, label: 'Niveaux', path: '/admin/levels', roles: ['admin'] },
  { icon: ClipboardList, label: 'Classes', path: '/admin/classes', roles: ['admin'] },
  { icon: BookOpen, label: 'Cours', path: '/admin/courses', roles: ['admin'] },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications', roles: ['admin'] },
  { icon: Upload, label: 'Documents', path: '/admin/documents', roles: ['admin'] },
  { icon: BarChart3, label: 'Statistiques', path: '/admin/stats', roles: ['admin'] },
  { icon: FileText, label: 'Exports', path: '/admin/exports', roles: ['admin'] },
  { icon: School, label: 'Écoles', path: '/superadmin/schools', roles: ['superadmin'] },
  { icon: Bell, label: 'Notifications', path: '/professor/notifications', roles: ['professor'] },
  { icon: MessageSquare, label: 'Questions', path: '/professor/questions', roles: ['professor'] },
  { icon: Upload, label: 'Mes documents', path: '/professor/documents', roles: ['professor'] },
  { icon: Settings, label: 'Profil', path: '/profile', roles: ['student', 'professor', 'admin', 'superadmin'] },
];

export default function Sidebar() {
  const { role, school, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const filteredItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  ).map((item) => ({
    ...item,
    path: item.label === 'Tableau de bord' && role ? dashboardPaths[role] || item.path : item.path,
  }));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 border-b border-nuit-600/50 shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">Assistant</p>
              <p className="text-xs text-emeraude-400 leading-tight truncate">Réussite</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors hidden lg:block"
          aria-label={sidebarOpen ? 'Réduire' : 'Agrandir'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-emeraude-500/10 text-emeraude-400 border border-emeraude-500/20'
                  : 'text-nuit-300 hover:text-white hover:bg-white/5'
              )
            }
          >
            <item.icon size={18} className="shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium whitespace-nowrap truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-nuit-600/50 p-3 space-y-2 shrink-0">
        {school && sidebarOpen && (
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-xs text-nuit-300 truncate">{school.name}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-nuit-300 hover:text-danger hover:bg-danger/5 transition-all duration-200"
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 72 }}
        className="fixed left-0 top-0 h-screen glass border-r border-nuit-600/50 z-50 overflow-hidden hidden lg:flex flex-col"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[260px] h-full glass border-r border-nuit-600/50 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

