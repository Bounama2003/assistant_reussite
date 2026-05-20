import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Brain, BarChart3, BookOpen, ArrowRight, Clock, Target } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { ChatSession, QuizSummary } from '@/types';


export default function StudentDashboard() {
  const { student, school } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    Promise.all([
      api.get(`/chat-sessions/student/${student.id}`).then((r) => setSessions(r.data)).catch(() => {}),
      api.get(`/quiz/student/${student.id}`).then((r) => setQuizzes(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [student]);

  const completedQuizzes = quizzes.filter((q) => q.status === 'completed');
  const totalCorrect = completedQuizzes.reduce((a, q) => a + q.score, 0);
  const totalQuestions = completedQuizzes.reduce((a, q) => a + q.total_questions, 0);
  const avgScore = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const recentActivity = [
    ...sessions.slice(0, 3).map((s) => ({ type: 'chat' as const, title: s.title, date: '', id: s.id })),
    ...quizzes.slice(0, 2).map((q) => ({ type: 'quiz' as const, title: q.title, date: q.completed_at || q.started_at || '', id: q.id })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  const stats = [
    { icon: MessageSquare, label: 'Conversations', value: sessions.length, color: 'from-blue-500 to-blue-600', link: '/sessions' },
    { icon: Brain, label: 'Quiz complétés', value: completedQuizzes.length, color: 'from-emeraude-500 to-emeraude-600', link: '/quiz' },
    { icon: BarChart3, label: 'Score moyen', value: `${avgScore}%`, color: 'from-purple-500 to-purple-600', link: '/quiz' },
    { icon: BookOpen, label: 'Quiz disponibles', value: quizzes.length, color: 'from-amber-500 to-amber-600', link: '/quiz' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Sticky header bar */}
      <div className="sticky top-0 bg-[#020617] border-b border-white/5 z-50 w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 py-3 flex items-center justify-between shadow-lg">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs sm:text-sm text-emeraude-400 font-medium">{school?.name}</p>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Bonjour, {student?.name?.split(' ')[0] || 'Élève'}
          </h1>
        </motion.div>
        <span className="text-xs text-slate-400 bg-white/5 rounded-lg px-2.5 py-1 shrink-0">{student?.classe || student?.serie || 'Élève'}</span>
      </div>

      <div className="pt-2 sm:pt-4 space-y-6 sm:space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(stat.link)}
              className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 justify-between hover:border-emeraude-500/30 transition-all duration-200 text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-tight">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
          {[
            { icon: MessageSquare, label: 'Nouveau chat', desc: 'Posez une question', path: '/chat', delay: 0.15 },
            { icon: Brain, label: 'Nouveau quiz', desc: 'Testez vos connaissances', path: '/quiz', delay: 0.18 },
            { icon: Clock, label: 'Mes sessions', desc: 'Voir l\'historique', path: '/sessions', delay: 0.21 },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: action.delay }}
              onClick={() => navigate(action.path)}
              className="glass rounded-xl flex items-center justify-between p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <action.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-white">{action.label}</p>
                  <p className="text-xs sm:text-sm text-nuit-300">{action.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-nuit-400 shrink-0 ml-2" />
            </motion.button>
          ))}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Activité récente</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="bg-[#0f172a] border border-white/5 rounded-2xl text-center py-8 sm:py-10">
              <Target className="w-8 h-8 text-nuit-400 mx-auto mb-2" />
              <p className="text-sm text-nuit-300">Commencez par une conversation ou un quiz</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentActivity.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.type === 'chat' ? `/chat/${item.id}` : `/quiz/${item.id}`)}
                  className="bg-[#0f172a] border border-white/5 rounded-2xl w-full text-left flex items-center gap-3 p-3 hover:border-emeraude-500/30 transition-all duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'chat' ? 'bg-emeraude-500/10' : 'bg-purple-500/10'}`}>
                    {item.type === 'chat'
                      ? <MessageSquare className="w-4 h-4 text-emeraude-400" />
                      : <Brain className="w-4 h-4 text-purple-400" />
                    }
                  </div>
                  <div className="flex items-center justify-between w-full min-w-0">
                    <p className="max-w-[75%] truncate text-sm text-slate-200">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
