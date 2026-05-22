import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, MessageSquare, TrendingUp, UserCheck, Activity, Zap, ArrowLeft, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { SchoolStats } from '@/types';

const COLORS = ['#11caa0', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminStats() {
  const { adminKey, schoolId, school } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [extra, setExtra] = useState({ totalStudents: 0, totalProfessors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !adminKey) return;
    Promise.all([
      api.get(`/stats/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } }),
      api.get(`/student/admin/${schoolId}/students`, { headers: { 'X-Admin-Key': adminKey } }).catch(() => ({ data: [] })),
      api.get(`/professors/professors-list/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } }).catch(() => ({ data: [] })),
    ]).then(([statsRes, studentsRes, profsRes]) => {
      setStats(statsRes.data);
      setExtra({ totalStudents: (studentsRes.data || []).length, totalProfessors: (profsRes.data || []).length });
    }).catch(() => setError('Impossible de charger les statistiques')).finally(() => setLoading(false));
  }, [schoolId, adminKey]);

  if (loading) return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">{[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 sm:h-28 rounded-xl" />)}</div>
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6"><div className="skeleton h-60 sm:h-80 rounded-xl" /><div className="skeleton h-60 sm:h-80 rounded-xl" /></div>
    </div>
  );

  if (error) return <div className="glass rounded-xl text-center py-12 text-danger text-sm">{error}</div>;

  const totalLeads = stats?.leads?.total || 0;
  const totalFiles = stats?.documents?.total_files || 0;
  const totalChunks = stats?.documents?.total_chunks || 0;
  const totalSessions = stats?.chats?.total_sessions || 0;
  const totalMessages = stats?.chats?.total_messages || 0;
  const conversionRate = stats?.leads?.conversion_rate ?? 0;
  const totalAllLeads = stats?.leads?.total_all ?? 0;

  const leadsByDayData = stats?.leads?.by_day ? Object.entries(stats.leads.by_day).map(([d, c]) => ({ day: d.slice(5), count: c })) : [];
  const docsByMatiereData = stats?.documents?.by_matiere ? Object.entries(stats.documents.by_matiere).map(([n, v]) => ({ name: n, value: v })) : [];
  const messagesByDayData = stats?.chats?.messages_by_day ? Object.entries(stats.chats.messages_by_day).map(([d, c]) => ({ day: d.slice(5), count: c })) : [];
  const rawHeatmap = stats?.chats?.heatmap || {};
  const heatmapDays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const heatmapHours = Array.from({ length: 12 }, (_, i) => String(i * 2));
  const maxHeat = Math.max(...Object.values(rawHeatmap).flatMap((h) => Object.values(h)), 1);
  const maxDocs = Math.max(...docsByMatiereData.map((d) => d.value), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs sm:text-sm text-nuit-300 hover:text-white transition-colors">
        <ArrowLeft size={14} className="sm:w-4" /> Retour
      </button>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{school?.name} — Analyses</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { icon: Users, value: totalLeads, label: 'Leads (30j)', color: 'from-emeraude-500 to-emeraude-600' },
          { icon: UserCheck, value: extra.totalStudents, label: 'Élèves', color: 'from-blue-500 to-blue-600' },
          { icon: Activity, value: totalMessages, label: 'Messages', color: 'from-purple-500 to-purple-600' },
          { icon: TrendingUp, value: `${conversionRate}%`, label: `Conversion`, color: 'from-amber-500 to-amber-600' },
        ].map((k, i) => (
          <div key={k.label} className="glass rounded-xl p-3 sm:p-4 text-center">
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}>
              <k.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
            <p className="text-sm sm:text-xl font-bold text-white">{k.value}</p>
            <p className="text-xs sm:text-xs text-nuit-300">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="sm:col-span-2 glass rounded-xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4">Nouveaux leads (30j)</h3>
          {leadsByDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={leadsByDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="day" stroke="#4a5a7c" fontSize={10} />
                <YAxis stroke="#4a5a7c" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#111d3a', border: '1px solid #1a2744', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#11caa0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-nuit-300 text-center py-8">Aucune donnée</p>}
        </div>

        <div className="glass rounded-xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4">Documents par matière</h3>
          {docsByMatiereData.length > 0 ? (
            <div className="space-y-2.5">
              {docsByMatiereData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs sm:text-sm mb-0.5">
                    <span className="text-nuit-200 truncate">{item.name}</span>
                    <span className="text-white font-medium shrink-0 ml-2">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-nuit-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / maxDocs) * 100}%` }}
                      className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-nuit-300 text-center py-8">Aucun document</p>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass rounded-xl p-4 sm:p-5 overflow-hidden">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4">Activité</h3>
          {messagesByDayData.length > 0 ? (
            <div className="w-full" style={{ minHeight: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={messagesByDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="day" stroke="#4a5a7c" fontSize={9} tick={{ fontSize: 9 }} />
                  <YAxis stroke="#4a5a7c" fontSize={9} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111d3a', border: '1px solid #1a2744', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="count" stroke="#11caa0" strokeWidth={2} dot={{ fill: '#11caa0', r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-nuit-300 text-center py-8">Aucune donnée</p>}
        </div>

        <div className="glass rounded-xl p-4 sm:p-5 overflow-hidden">
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emeraude-400" /> Heatmap
          </h3>
          {Object.keys(rawHeatmap).length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(12, minmax(22px, 1fr))', gap: '0.125rem', minWidth: '280px', fontSize: '0.65rem' }}>
                  <div className="text-nuit-400 px-0.5" />
                  {heatmapHours.map((h) => (<div key={h} className="text-nuit-400 text-center text-[10px]">{h}</div>))}
                  {heatmapDays.map((day) => (
                    <>
                      <div key={day} className="text-nuit-300 px-0.5 py-1 text-[10px]">{day}</div>
                      {heatmapHours.map((h) => {
                        const val = rawHeatmap[day]?.[h] || 0;
                        return (
                          <div key={day + '-' + h} className="h-3.5 sm:h-5 rounded-sm flex items-center justify-center"
                            style={{ fontSize: '9px', backgroundColor: val > 0 ? 'rgba(17,202,160,' + (0.1 + (val / maxHeat) * 0.9) + ')' : 'rgba(255,255,255,0.03)' }}
                            title={day + ' ' + h + 'h: ' + val}>{val > 0 ? val : ''}</div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-nuit-400">
                <span>Faible</span>
                <div className="flex gap-0.5">{[0.1,0.3,0.5,0.7,0.9].map((o) => (<div key={o} className="w-3 h-2 sm:w-4 sm:h-3 rounded" style={{ backgroundColor: 'rgba(17,202,160,' + o + ')' }} />))}</div>
                <span>Fort</span>
              </div>
            </>
          ) : <p className="text-xs text-nuit-300 text-center py-8">Pas assez de données</p>}
        </div>
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4">Résumé</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Leads (30j)', value: totalLeads, icon: Users },
            { label: 'Élèves', value: extra.totalStudents, icon: UserCheck },
            { label: 'Professeurs', value: extra.totalProfessors, icon: GraduationCap },
            { label: 'Sessions', value: totalSessions, icon: MessageSquare },
            { label: 'Messages', value: totalMessages, icon: Activity },
            { label: 'Documents', value: `${totalFiles}`, icon: FileText },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 sm:flex-col sm:text-center">
              <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nuit-400 shrink-0 sm:mx-auto" />
              <div>
                <p className="text-sm sm:text-base font-bold text-white">{item.value}</p>
                <p className="text-xs sm:text-xs text-nuit-300">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
