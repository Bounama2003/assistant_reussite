import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, MessageSquare, BarChart3, TrendingUp, GraduationCap, UserCheck, ArrowRight, School } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { SchoolStats } from '@/types';

export default function AdminDashboard() {
  const { adminKey, schoolId, school } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [extra, setExtra] = useState({ totalStudents: 0, totalProfessors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !adminKey) return;
    setError(null);

    const controller = new AbortController();
    const headers = { 'X-Admin-Key': adminKey };

    Promise.all([
      api.get(`/stats/${schoolId}`, { headers, signal: controller.signal }).catch((err) => {
        if (err?.name !== 'CanceledError') console.error('Stats fetch failed:', err);
        return { data: null };
      }),
      api.get(`/student/admin/${schoolId}/students`, { headers, signal: controller.signal }).catch(() => ({ data: [] })),
      api.get(`/professors/professors-list/${schoolId}`, { headers, signal: controller.signal }).catch(() => ({ data: [] })),
    ]).then(([statsRes, studentsRes, profsRes]) => {
      if (statsRes.data) {
        setStats(statsRes.data);
      } else {
        setError('Impossible de charger les statistiques. Vérifiez que la base de données est à jour.');
      }
      setExtra({
        totalStudents: (studentsRes.data || []).length,
        totalProfessors: (profsRes.data || []).length,
      });
    }).catch((err) => {
      if (err?.name !== 'CanceledError') {
        console.error('Dashboard data load failed:', err);
        setError('Erreur lors du chargement des données.');
      }
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [schoolId, adminKey]);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton h-24 sm:h-28 rounded-xl" />)}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <BarChart3 className="w-7 h-7 text-danger" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">Données indisponibles</h2>
      <p className="text-sm text-nuit-300 max-w-md mb-4">{error}</p>
      <button onClick={() => window.location.reload()}
        className="btn-primary text-sm">
        Réessayer
      </button>
    </div>
  );

  const totalLeads = stats?.leads?.total || 0;
  const totalFiles = stats?.documents?.total_files || 0;
  const totalSessions = stats?.chats?.total_sessions || 0;
  const totalMessages = stats?.chats?.total_messages || 0;
  const conversionRate = stats?.leads?.conversion_rate ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{school?.name} — Aperçu</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { icon: Users, label: 'Leads (30j)', value: totalLeads, color: 'from-emeraude-500 to-emeraude-600', link: '/admin/leads' },
          { icon: UserCheck, label: 'Élèves', value: extra.totalStudents, color: 'from-blue-500 to-blue-600', link: '/admin/students' },
          { icon: GraduationCap, label: 'Professeurs', value: extra.totalProfessors, color: 'from-purple-500 to-purple-600', link: '/admin/professors' },
          { icon: TrendingUp, label: 'Conversion', value: `${conversionRate}%`, color: 'from-amber-500 to-amber-600' },
          { icon: MessageSquare, label: 'Messages', value: totalMessages, color: 'from-pink-500 to-pink-600' },
          { icon: FileText, label: 'Documents', value: totalFiles, color: 'from-emeraude-500 to-emeraude-600', link: '/admin/documents' },
        ].map((kpi, i) => (
          <motion.button key={kpi.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => kpi.link && navigate(kpi.link)}
            className="glass rounded-xl text-left p-3 sm:p-4 hover:border-emeraude-500/30 transition-all">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-1.5 sm:mb-2`}>
              <kpi.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-white leading-tight">{kpi.value}</p>
            <p className="text-[10px] sm:text-xs text-nuit-300 mt-0.5">{kpi.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Statistiques', desc: 'Graphiques et analyses', path: '/admin/stats', icon: BarChart3 },
          { label: 'Leads', desc: 'Inscriptions et conversions', path: '/admin/leads', icon: Users },
          { label: 'Élèves', desc: 'Gestion des comptes', path: '/admin/students', icon: UserCheck },
          { label: 'Professeurs', desc: 'Création et clés', path: '/admin/professors', icon: GraduationCap },
          { label: 'Documents', desc: 'Import et gestion', path: '/admin/documents', icon: FileText },
          { label: 'Configuration', desc: 'Niveaux, classes, cours', path: '/admin/levels', icon: School },
        ].map((link, i) => (
          <motion.button key={link.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }}
            onClick={() => navigate(link.path)}
            className="glass rounded-xl flex items-center gap-3 p-3 sm:p-4 hover:border-emeraude-500/30 transition-all text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emeraude-500/10 flex items-center justify-center shrink-0">
              <link.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{link.label}</p>
              <p className="text-xs text-nuit-300">{link.desc}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nuit-400 shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
