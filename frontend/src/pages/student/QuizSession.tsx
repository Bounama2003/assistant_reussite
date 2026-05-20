import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { QuizSession, QuizAnswerResponse, QuizResult } from '@/types';

export default function StudentQuizSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { student } = useAuthStore();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<QuizAnswerResponse | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (sessionId) loadSession(); }, [sessionId]);

  const loadSession = async () => {
    if (!student) return;
    try {
      const res = await api.get<QuizSession>(`/quiz/${sessionId}`, { headers: { 'X-Student-Id': student.id } });
      setSession(res.data);
      const idx = res.data.questions.findIndex((q) => !q.answered);
      if (idx >= 0) setCurrentQuestion(idx);
      if (res.data.status === 'completed') {
        const r = await api.get<QuizResult>(`/quiz/${sessionId}/result`);
        setResult(r.data);
      }
    } catch (err: any) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setLoading(false); }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!session || submitting) return;
    const q = session.questions[currentQuestion];
    setSubmitting(true); setFeedback(null);
    try {
      const res = await api.post<QuizAnswerResponse>(`/quiz/${sessionId}/answer`, { question_id: q.id, answer: answerIndex });
      setFeedback(res.data);
      const updated = { ...session };
      updated.questions[currentQuestion].answered = true;
      updated.questions[currentQuestion].student_answer = answerIndex;
      updated.questions[currentQuestion].is_correct = res.data.is_correct;
      updated.answered_count += 1;
      updated.score += res.data.is_correct ? 1 : 0;
      setSession(updated);
      if (res.data.quiz_completed) {
        const r = await api.get<QuizResult>(`/quiz/${sessionId}/result`);
        setResult(r.data);
      }
    } catch (err: any) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSubmitting(false); }
  };

  const nextQuestion = () => {
    if (!session) return;
    setFeedback(null); setError(null);
    if (currentQuestion < session.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-emeraude-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error && !session) return <div className="glass rounded-xl text-center py-12"><p className="text-danger text-sm">{error}</p></div>;
  if (!session) return null;

  // Results
  if (result) return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="glass rounded-xl text-center py-6 sm:py-10 px-4">
        <Trophy className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${result.score >= 70 ? 'text-emeraude-400' : result.score >= 40 ? 'text-warning' : 'text-danger'}`} />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Quiz terminé !</h2>
        <p className="text-sm text-nuit-300 mb-3 sm:mb-4">{session.title}</p>
        <div className="text-4xl sm:text-5xl font-bold gradient-text mb-1">{result.score}%</div>
        <p className="text-sm text-nuit-300">{result.correct_answers}/{result.total_questions} bonnes réponses</p>
      </div>
      {result.recommendations.length > 0 && (
        <div className="glass rounded-xl p-3.5 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emeraude-400" /> Points à revoir
          </h3>
          <ul className="space-y-1.5">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-nuit-300 flex items-start gap-2">
                <span className="text-emeraude-400 mt-0.5 shrink-0">•</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={() => navigate('/quiz')} className="btn-primary w-full sm:w-auto mx-auto block text-sm">Retour aux quiz</button>
    </motion.div>
  );

  const q = session.questions[currentQuestion];
  const progress = (session.answered_count / session.total_questions) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/quiz')} className="p-1.5 rounded-lg hover:bg-white/5 text-nuit-300">
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Question {currentQuestion + 1} sur {session.total_questions}</span>
          <span className="flex items-center gap-1.5">
            <span className="bg-emeraude-500/10 text-emeraude-400 font-semibold px-1.5 py-0.5 rounded text-xs leading-none">{session.score}✓</span>
            <span className="text-nuit-400 text-xs">{Math.round(progress)}%</span>
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#11caa0] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(17,202,160,0.5)]"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Question */}
      <motion.div key={q.id} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
        <h3 className="text-base font-bold text-white leading-relaxed mb-6 bg-[#0f172a]/40 border border-white/5 p-4 rounded-2xl">
          {q.question_text}
        </h3>

        <div className="space-y-2.5">
          {q.options.map((option, i) => {
            const isSelected = q.student_answer === i;
            const isCorrectAnswer = feedback && feedback.correct_answer === i;
            const isWrongSelection = feedback && isSelected && !feedback.is_correct;

            let cardStyle = 'bg-[#0f172a] border border-white/5';
            let dotBorder = 'border-2 border-white/20';
            let dotInner = '';

            if (feedback) {
              if (isCorrectAnswer) {
                cardStyle = 'border-emeraude-500 bg-emeraude-500/10 shadow-[0_0_15px_rgba(52,211,153,0.08)]';
                dotBorder = 'border-2 border-emeraude-400';
                dotInner = 'bg-emeraude-400';
              } else if (isWrongSelection) {
                cardStyle = 'border-red-500/60 bg-red-500/10';
                dotBorder = 'border-2 border-red-400';
                dotInner = 'bg-red-400';
              } else {
                cardStyle = 'bg-[#0f172a] border border-white/5 opacity-40';
              }
            } else if (isSelected) {
              cardStyle = 'border-[#11caa0] bg-[#11caa0]/5 shadow-[0_0_15px_rgba(17,202,160,0.08)]';
              dotBorder = 'border-2 border-[#11caa0]';
              dotInner = 'bg-[#11caa0]';
            }

            return (
              <motion.button key={i} disabled={!!feedback || q.answered} onClick={() => submitAnswer(i)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`w-full rounded-2xl p-4 text-left text-sm text-slate-200 transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-center gap-3 ${cardStyle}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${dotBorder}`}>
                  {dotInner && <div className={`w-2.5 h-2.5 rounded-full ${dotInner} transition-all duration-200`} />}
                </div>
                <span className="flex-1 leading-snug">{option}</span>
                {feedback && isCorrectAnswer && <CheckCircle className="w-4 h-4 text-emeraude-400 shrink-0" />}
                {feedback && isWrongSelection && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${feedback.is_correct ? 'bg-emeraude-500/5 border-emeraude-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            {feedback.is_correct
              ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-emeraude-400" />
              : <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
            }
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white">{feedback.is_correct ? 'Bonne réponse !' : 'Mauvaise réponse'}</p>
              <p className="text-sm text-nuit-300 mt-1 leading-relaxed">{feedback.explanation}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {q.source_doc_matiere && <span className="text-xs bg-emeraude-500/10 text-emeraude-400 px-2 py-0.5 rounded">{q.source_doc_matiere}</span>}
                {q.chapter && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{q.chapter}</span>}
              </div>
            </div>
          </div>
          {currentQuestion < session.questions.length - 1 && (
            <button onClick={nextQuestion}
              className="w-full py-4 bg-[#11caa0] text-[#020617] rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#11caa0]/10 active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2">
              Question suivante <ArrowRight size={15} />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
