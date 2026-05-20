import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, School, Users, FileText, TrendingUp, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { GlobalStats } from '@/types';

export default function SuperAdminStats() {
  const { superAdminKey } = useAuthStore();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!superAdminKey) return;
    api.get('/admin/stats', { headers: { 'X-Super-Admin-Key': superAdminKey } })
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [superAdminKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (!stats) return null;

  const topStats = [
    { icon: School, label: 'Écoles', value: stats.total_schools, color: 'from-emeraude-500 to-emeraude-600' },
    { icon: Users, label: 'Leads', value: stats.total_leads, color: 'from-blue-500 to-blue-600' },
    { icon: FileText, label: 'Documents', value: stats.total_documents, color: 'from-purple-500 to-purple-600' },
  ];

  const schoolChartData = stats.schools.map((s) => ({
    name: s.id,
    leads: s.lead_count,
    documents: s.document_count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistiques globales</h1>
        <p className="text-nuit-300 text-sm">Aperçu multi-établissements</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {topStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-nuit-300">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Leads et documents par école</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={schoolChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
            <XAxis dataKey="name" stroke="#4a5a7c" fontSize={12} />
            <YAxis stroke="#4a5a7c" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#111d3a', border: '1px solid #1a2744', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="leads" fill="#11caa0" radius={[4, 4, 0, 0]} name="Leads" />
            <Bar dataKey="documents" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Documents" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-lg font-semibold text-white mb-4">Détail des écoles</h3>
        <div className="space-y-2">
          {stats.schools.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              className="card-hover flex items-center gap-4 py-3"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.primary_color }} />
              <div className="flex-1 grid grid-cols-4 gap-4">
                <p className="text-sm font-medium text-white">{s.name}</p>
                <p className="text-sm text-nuit-300">{s.lead_count} leads</p>
                <p className="text-sm text-nuit-300">{s.document_count} docs</p>
                <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${s.is_suspended ? 'bg-danger/10 text-danger' : 'bg-emeraude-500/10 text-emeraude-400'}`}>
                  {s.is_suspended ? 'Suspendue' : 'Active'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
