import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, ThumbsDown, Star, FileText, Bell, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { ProfessorStats, ProfessorDocumentStat } from '@/types';

export default function ProfessorDashboard() {
  const { professorKey } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProfessorStats | null>(null);
  const [documents, setDocuments] = useState<ProfessorDocumentStat[]>([]);
  const [topQuestions, setTopQuestions] = useState<Array<{ topic: string; count: number; matiere: string }>>([]);
  const [difficulties, setDifficulties] = useState<Array<{ matiere: string; avg_score: number; total_quiz: number; total_questions: number; niveau: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!professorKey) return;
    Promise.all([
      api.get('/professor/dashboard/stats', { headers: { 'X-Professor-Key': professorKey } }).then((r) => setStats(r.data)).catch(() => {}),
      api.get('/professor/dashboard/documents', { headers: { 'X-Professor-Key': professorKey } }).then((r) => setDocuments(r.data)).catch(() => {}),
      api.get('/professor/dashboard/top-questions', { params: { top: 5 }, headers: { 'X-Professor-Key': professorKey } }).then((r) => setTopQuestions(r.data)).catch(() => {}),
      api.get('/professor/dashboard/difficulties', { headers: { 'X-Professor-Key': professorKey } }).then((r) => setDifficulties(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [professorKey]);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 sm:h-28 rounded-xl" />)}
    </div>
  );

  const maxCount = Math.max(...topQuestions.map((x) => x.count), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">Aperçu de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { icon: MessageSquare, label: 'Questions', value: stats?.total_questions || 0, color: 'from-emeraude-500 to-emeraude-600' },
          { icon: ThumbsUp, label: "J'aime", value: stats?.thumbs_up || 0, color: 'from-blue-500 to-blue-600' },
          { icon: ThumbsDown, label: "Je n'aime pas", value: stats?.thumbs_down || 0, color: 'from-danger to-red-600' },
          { icon: Star, label: 'Note moyenne', value: stats?.avg_rating ? `${stats.avg_rating}/5` : 'N/A', color: 'from-amber-500 to-amber-600' },
        ].map((stat, i) => (
          <div key={stat.label} className="glass rounded-xl p-3 sm:p-4">
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 sm:mb-3`}>
              <stat.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
            <p className="text-base sm:text-2xl font-bold text-white leading-tight">{stat.value}</p>
            <p className="text-[11px] sm:text-sm text-nuit-300 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Navigation links */}
      <div className="flex gap-1.5 sm:gap-2">
        {[
          { icon: FileText, label: 'Documents', path: '/professor/documents' },
          { icon: MessageSquare, label: 'Questions', path: '/professor/questions' },
          { icon: Bell, label: 'Notifications', path: '/professor/notifications' },
        ].map((link) => (
          <button key={link.label} onClick={() => navigate(link.path)}
            className="flex-1 sm:flex-none glass rounded-xl p-2.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-nuit-200 hover:border-emeraude-500/30 transition-all flex items-center justify-center gap-1.5">
            <link.icon size={14} className="sm:w-[15px]" />
            <span className="hidden sm:inline">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Top questions */}
      <div className="glass rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Sujets les plus demandés</h3>
        {topQuestions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="hidden sm:block">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topQuestions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="topic" stroke="#4a5a7c" fontSize={12} />
                  <YAxis stroke="#4a5a7c" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111d3a', border: '1px solid #1a2744', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#11caa0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {topQuestions.map((q, i) => (
                <div key={q.topic}>
                  <div className="flex items-center justify-between text-sm mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-nuit-400 w-4 shrink-0">{i + 1}.</span>
                      <span className="text-nuit-200 truncate text-sm">{q.topic}</span>
                    </div>
                    <span className="text-emeraude-400 font-medium text-sm shrink-0 ml-2">{q.count}</span>
                  </div>
                  <div className="h-1.5 bg-nuit-700 rounded-full overflow-hidden ml-6">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(q.count / maxCount) * 100}%` }}
                      className="h-full bg-emeraude-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-nuit-300 text-center py-6 sm:py-8">Les sujets apparaîtront ici quand les élèves poseront des questions.</p>
        )}
      </div>

      {/* Niveau par matière */}
      <div className="glass rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emeraude-400" /> Niveau par matière
        </h3>
        {difficulties.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {difficulties.map((d) => (
              <div key={d.matiere}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{d.matiere}</span>
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      d.niveau === 'faible' ? 'bg-danger/10 text-danger' :
                      d.niveau === 'moyen' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emeraude-500/10 text-emeraude-400'
                    }`}>
                      {d.niveau === 'faible' ? 'Faible' : d.niveau === 'moyen' ? 'Moyen' : 'Bon'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">{d.avg_score}%</span>
                </div>
                <div className="h-1.5 sm:h-2 bg-nuit-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.avg_score}%` }}
                    className={`h-full rounded-full ${d.avg_score >= 70 ? 'bg-emeraude-500' : d.avg_score >= 50 ? 'bg-amber-500' : 'bg-danger'}`} />
                </div>
                <p className="text-[11px] text-nuit-400 mt-0.5">{d.total_quiz} quiz • {d.total_questions} questions</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-nuit-300 text-center py-6 sm:py-8">Les résultats des quiz apparaîtront ici.</p>
        )}
      </div>

      {/* Documents - compact */}
      {documents.length > 0 && (
        <div className="glass rounded-xl p-4 sm:p-5">
          <button onClick={() => setShowTable(!showTable)} className="flex items-center justify-between w-full text-left mb-3 sm:mb-4">
            <h3 className="text-sm font-semibold text-white">Documents ({documents.length})</h3>
            <span className="text-xs text-emeraude-400">{showTable ? 'Masquer' : 'Voir'}</span>
          </button>
          {showTable && (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[500px] px-4 sm:px-0 text-sm">
                <div className="grid grid-cols-7 gap-2 text-[11px] text-nuit-400 font-medium pb-2 border-b border-nuit-600/50 mb-2">
                  <span className="col-span-2">Document</span>
                  <span>Matière</span>
                  <span>Classe</span>
                  <span className="text-center">Q</span>
                  <span className="text-center">👍</span>
                  <span className="text-center">Note</span>
                </div>
                {documents.map((doc) => (
                  <div key={doc.filename} className="grid grid-cols-7 gap-2 text-sm py-2 border-b border-nuit-600/30 items-center">
                    <span className="col-span-2 text-white truncate text-xs">{doc.filename}</span>
                    <span className="text-nuit-300 text-xs">{doc.matiere}</span>
                    <span className="text-nuit-300 text-xs">{doc.classe}</span>
                    <span className="text-center text-white text-xs">{doc.query_count}</span>
                    <span className="text-center text-emeraude-400 text-xs">{doc.thumbs_up}</span>
                    <span className="text-center text-nuit-300 text-xs">{doc.avg_rating != null ? `${doc.avg_rating}` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
