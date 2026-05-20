import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Plus, Play, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { QuizSummary, QuizStartResponse, SchoolCourse } from '@/types';

export default function StudentQuiz() {
  const { student, schoolId } = useAuthStore();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [courses, setCourses] = useState<SchoolCourse[]>([]);
  const [form, setForm] = useState({ matiere: '', question_count: 5 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    Promise.all([
      api.get(`/quiz/student/${student.id}`),
      api.get(`/school/${student.school_id}/courses`).catch(() => ({ data: [] })),
    ]).then(([quizRes, coursesRes]) => {
      setQuizzes(quizRes.data);
      setCourses(coursesRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [student]);

  const startQuiz = async () => {
    if (!student || !schoolId) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<QuizStartResponse>('/quiz', {
        student_id: student.id, school_id: schoolId,
        matiere: form.matiere || undefined,
        classe: student.classe || undefined,
        question_count: form.question_count,
      });
      setShowCreate(false);
      navigate(`/quiz/${res.data.session_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du quiz');
    } finally { setCreating(false); }
  };

  const filtered = quizzes.filter((q) => filter === 'all' || q.status === filter);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Quiz</h1>
          <p className="text-xs sm:text-sm text-nuit-300 leading-snug mt-0.5">Testez vos connaissances avec des QCM interactifs</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Plus size={14} /> Quiz
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 sm:gap-2">
        {(['all', 'in_progress', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-[#11caa0]/10 text-[#11caa0] border border-[#11caa0]/30 font-semibold'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}>
            {f === 'all' ? 'Tous' : f === 'in_progress' ? 'En cours' : 'Terminés'}
          </button>
        ))}
      </div>

      {/* Quiz list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 sm:h-28 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-8 sm:py-12 px-4">
          <div className="w-11 h-11 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-5 h-5 text-emeraude-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Aucun quiz</h3>
          <p className="text-sm text-nuit-300 mb-4">Créez votre premier quiz pour tester vos connaissances</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto flex items-center gap-2 text-sm">
            <Plus size={15} /> Créer un quiz
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {filtered.map((quiz, i) => (
            <motion.button key={quiz.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              className="glass rounded-xl text-left p-4 sm:p-5 hover:border-emeraude-500/30 transition-all duration-200 w-full flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                  quiz.status === 'completed' ? 'bg-emeraude-500/10 text-emeraude-400' : 'bg-warning/10 text-warning'
                }`}>
                  {quiz.status === 'completed' ? 'Terminé' : 'En cours'}
                </span>
                {quiz.status === 'completed' && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block leading-tight">Score</span>
                    <span className={`text-lg font-bold ${
                      (quiz.score / quiz.total_questions) >= 0.7 ? 'text-emeraude-400' :
                      (quiz.score / quiz.total_questions) >= 0.4 ? 'text-[#ff9f0a]' : 'text-red-400'
                    }`}>{Math.round((quiz.score / quiz.total_questions) * 100)}%</span>
                  </div>
                )}
              </div>
              <p className="text-sm sm:text-base font-medium text-white leading-snug mb-1 line-clamp-2 break-words">{quiz.title}</p>
              <div className="flex items-center gap-3 text-[11px] sm:text-xs text-nuit-400 mt-auto">
                {quiz.matiere && <span>{quiz.matiere}</span>}
                {quiz.classe && <span>• {quiz.classe}</span>}
                <span>{quiz.answered_count}/{quiz.total_questions}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-lg z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-[#11caa0]/15 p-6 shadow-xl relative z-50"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-5">Nouveau quiz</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Matière</label>
                <div className="relative">
                  <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                    className="w-full bg-[#1e293b] text-[#f8fafc] border border-[#11caa0]/20 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-[#11caa0] appearance-none pr-10">
                    <option value="">Toutes les matières</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.nom_cours}>{c.nom_cours}{c.libelle ? ` (${c.libelle})` : ''}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Classe</label>
                <input type="text" value={student?.classe || student?.serie || ''}
                  className="w-full bg-[#1e293b] text-[#f8fafc] border border-[#11caa0]/20 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-[#11caa0] opacity-60 cursor-not-allowed" disabled />
                <p className="text-xs text-[#94a3b8]/70 mt-1.5">Quiz basé sur les cours de votre classe</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Questions (3-15)</label>
                <div className="flex items-center gap-3 mt-1">
                  <button type="button" onClick={() => setForm({ ...form, question_count: Math.max(3, form.question_count - 1) })}
                    disabled={form.question_count <= 3}
                    className="w-11 h-11 bg-[#0f172a] border border-white/10 rounded-xl text-white flex items-center justify-center text-lg active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100 shrink-0">
                    −
                  </button>
                  <span className="px-6 text-base font-semibold text-white tabular-nums">{form.question_count}</span>
                  <button type="button" onClick={() => setForm({ ...form, question_count: Math.min(15, form.question_count + 1) })}
                    disabled={form.question_count >= 15}
                    className="w-11 h-11 bg-[#0f172a] border border-white/10 rounded-xl text-white flex items-center justify-center text-lg active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100 shrink-0">
                    +
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-[#ef4444]">{error}</p>}
              <div className="flex items-center gap-4 mt-6">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 text-center rounded-xl border border-[#94a3b8]/30 text-[#94a3b8] hover:bg-white/5 font-semibold transition-colors">
                  Annuler
                </button>
                <button onClick={startQuiz} disabled={creating}
                  className="flex-1 py-3 bg-[#11caa0] text-[#020617] rounded-xl flex items-center justify-center gap-2 font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play size={15} />} Commencer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
