import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, User, BarChart3, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { ProfessorQuestionSummary } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function ProfessorQuestions() {
  const { professorKey } = useAuthStore();
  const [questions, setQuestions] = useState<ProfessorQuestionSummary[]>([]);
  const [topQuestions, setTopQuestions] = useState<Array<{ topic: string; count: number; matiere: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!professorKey) return;
    Promise.all([
      api.get('/professor/dashboard/questions', { params: { limit: 50 }, headers: { 'X-Professor-Key': professorKey } })
        .then((res) => setQuestions(res.data)).catch(() => {}),
      api.get('/professor/dashboard/top-questions', { params: { top: 10 }, headers: { 'X-Professor-Key': professorKey } })
        .then((res) => setTopQuestions(res.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [professorKey]);

  const filtered = questions.filter((q) =>
    q.student_name.toLowerCase().includes(search.toLowerCase()) ||
    q.question_preview.toLowerCase().includes(search.toLowerCase()) ||
    q.classe.toLowerCase().includes(search.toLowerCase())
  );

  const maxCount = Math.max(...topQuestions.map((x) => x.count), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Questions</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
        </div>
        <div className="relative max-w-[200px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nuit-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-xs sm:text-sm focus:outline-none focus:border-emeraude-500 transition-all"
            placeholder="Rechercher..." />
        </div>
      </div>

      <div className="space-y-4 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
        {/* Questions list */}
        <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 sm:h-[72px] w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucune question'}</h3>
              <p className="text-xs sm:text-sm text-nuit-300">{search ? 'Essayez un autre terme' : 'Les questions des élèves apparaîtront ici'}</p>
            </div>
          ) : (
            filtered.map((q, i) => (
              <motion.div key={`${q.session_id}-${i}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                onClick={() => setExpandedId(expandedId === `${q.session_id}-${i}` ? null : `${q.session_id}-${i}`)}
                className="glass rounded-xl p-3 sm:p-4 cursor-pointer hover:border-emeraude-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emeraude-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emeraude-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium text-white">{q.student_name}</span>
                      <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-nuit-700 text-nuit-300">{q.classe}</span>
                    </div>
                    <p className={`text-sm text-nuit-300 leading-relaxed ${expandedId !== `${q.session_id}-${i}` ? 'line-clamp-2' : ''}`}>
                      {q.question_preview}
                    </p>
                    {q.timestamp && (
                      <p className="text-[11px] text-nuit-400 mt-1.5">{formatDateTime(q.timestamp)}</p>
                    )}
                  </div>
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nuit-400 shrink-0 mt-1" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3 sm:space-y-4">
          {/* Sujets fréquents */}
          {topQuestions.length > 0 && (
            <div className="glass rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emeraude-400" /> Sujets fréquents
              </h3>
              <div className="space-y-2.5 sm:space-y-3">
                {topQuestions.map((t, i) => (
                  <div key={t.topic}>
                    <div className="flex justify-between text-xs sm:text-sm mb-0.5">
                      <span className="text-nuit-200 truncate">{t.topic}</span>
                      <span className="text-emeraude-400 font-medium shrink-0 ml-2">{t.count}</span>
                    </div>
                    <div className="h-1 sm:h-1.5 bg-nuit-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(t.count / maxCount) * 100}%` }}
                        className="h-full bg-emeraude-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Par matière */}
          {topQuestions.length > 0 && (
            <div className="glass rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emeraude-400" /> Par matière
              </h3>
              <div className="space-y-2">
                {Array.from(new Set(topQuestions.map((t) => t.matiere))).filter(Boolean).map((matiere) => (
                  <div key={matiere} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-nuit-200">{matiere}</span>
                    <span className="text-emeraude-400 font-medium">{topQuestions.filter((t) => t.matiere === matiere).reduce((a, t) => a + t.count, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topQuestions.length === 0 && !loading && (
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-sm text-nuit-300">Les sujets fréquents apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
