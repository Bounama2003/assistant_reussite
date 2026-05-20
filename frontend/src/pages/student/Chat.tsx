import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Plus, Trash2, Bot, User, BookOpen, Loader2, ChevronDown, Download, FileText, ThumbsUp, ThumbsDown, History, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { downloadFile } from '@/lib/download';
import api from '@/services/api';
import type { ChatSession, ChatMessage, ChatResponse, Source } from '@/types';

const SUGGESTIONS = [
  'Explique-moi le théorème de Pythagore',
  'Aide-moi à réviser les fonctions linéaires',
  'Quels sont les types de textes en français ?',
  'Résume le cours sur la photosynthèse',
];

function parseInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m
      ? <strong key={i} className="font-semibold text-[#11caa0]">{m[1]}</strong>
      : <span key={i}>{part}</span>;
  });
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(<ul key={key++} className="list-disc pl-5 space-y-2 my-2 text-[#f8fafc]/90">{listItems}</ul>);
    listItems = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushList();
      if (i > 0 && lines[i - 1].trim() === '') continue;
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    const heading = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (heading) {
      flushList();
      nodes.push(<h3 key={key++} className="text-[#11caa0] font-bold text-base mt-4 mb-2 block">{heading[1]}</h3>);
      continue;
    }

    const bullet = trimmed.match(/^[\*\+]\s+(.*)/);
    if (bullet) {
      if (!inList) flushList();
      inList = true;
      listItems.push(<li key={key++}>{parseInline(bullet[1])}</li>);
      continue;
    }

    flushList();
    nodes.push(<div key={key++} className="mb-1">{parseInline(lines[i])}</div>);
  }
  flushList();

  return nodes.length ? nodes : [<span key={0}>{text}</span>];
}

function SidebarContent({ sessions, loadingSessions, currentSessionId, onSelect, onCreate, onDelete }: {
  sessions: ChatSession[]; loadingSessions: boolean; currentSessionId: string | null;
  onSelect: (id: string) => void; onCreate: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-nuit-600/50">
        <button onClick={onCreate} className="w-full bg-emeraude-500 text-nuit-900 rounded-lg text-sm font-semibold py-2.5 px-3 hover:bg-emeraude-400 transition-colors flex items-center justify-center gap-2">
          <Plus size={14} /> Nouveau chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingSessions ? (
          [1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)
        ) : sessions.length === 0 ? (
          <p className="text-xs text-nuit-400 text-center py-8">Aucune conversation</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                currentSessionId === s.id ? 'bg-emeraude-500/10 border border-emeraude-500/20' : 'hover:bg-white/5'
              }`}
              onClick={() => onSelect(s.id)}>
              <MessageSquare size={14} className="shrink-0 text-nuit-400" />
              <span className="text-sm text-nuit-200 truncate flex-1">{s.title}</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/10 rounded transition-all">
                <Trash2 size={12} className="text-danger" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function StudentChat() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const { student, schoolId } = useAuthStore();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(routeSessionId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [ratedMessages, setRatedMessages] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionTitle = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId)?.title || 'Chat'
    : 'Nouvelle conversation';

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamContent]);

  useEffect(() => {
    if (!student) return;
    setLoadingSessions(true);
    api.get(`/chat-sessions/student/${student.id}`)
      .then((res) => { setSessions(res.data); setLoadingSessions(false); })
      .catch(() => setLoadingSessions(false));
  }, [student]);

  useEffect(() => {
    if (!routeSessionId) return;
    setCurrentSessionId(routeSessionId);
    setLoading(true);
    api.get(`/chat-sessions/${routeSessionId}/messages`)
      .then((res) => { setMessages(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [routeSessionId]);

  const createSession = async () => {
    if (!student || !schoolId) return;
    try {
      const res = await api.post<ChatSession>('/chat-sessions', null, {
        params: { student_id: student.id, school_id: schoolId },
      });
      setSessions((prev) => [res.data, ...prev]);
      setSidebarOpen(false);
      navigate(`/chat/${res.data.id}`);
    } catch (err) { console.error('Session creation failed', err); }
  };

  const deleteSession = async (id: string) => {
    try {
      await api.delete(`/chat-sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
        navigate('/chat');
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (text?: string) => {
    const q = text || question;
    if (!q.trim() || !schoolId || streaming) return;
    let sessionId = currentSessionId;

    // Auto-create session if none exists
    if (!sessionId && student) {
      try {
        const res = await api.post<ChatSession>('/chat-sessions', null, {
          params: { student_id: student.id, school_id: schoolId },
        });
        sessionId = res.data.id;
        setCurrentSessionId(sessionId);
        setSessions((prev) => [res.data, ...prev]);
        window.history.replaceState(null, '', `/chat/${sessionId}`);
      } catch (err) { console.error('Auto-create session failed', err); }
    }

    setQuestion('');
    setStreaming(true);
    setStreamContent('');

    const userMsg: ChatMessage = { id: '', session_id: sessionId || '', role: 'user', content: q, sources: [] };
    const assistantMsg: ChatMessage = { id: '', session_id: sessionId || '', role: 'assistant', content: '', sources: [] };
    setMessages((prev) => [...prev, userMsg]);
    setMessages((prev) => [...prev, assistantMsg]);
    setStreaming(true);

    // Auto-title session from first message
    const isNewSession = sessionId && !sessions.find(s => s.id === sessionId)?.title;
    if (isNewSession && sessionId) {
      const title = q.length > 45 ? q.slice(0, 45) + '...' : q;
      try {
        await api.put(`/chat-sessions/${sessionId}/title?title=${encodeURIComponent(title)}`);
        setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, title } : s));
      } catch {}
    }

    try {
      const res = await api.post<ChatResponse>('/chat', {
        question: q, school_id: schoolId, student_id: student?.id || null,
        student_classe: student?.classe || null, session_id: sessionId || undefined,
      });
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') { last.content = res.data.answer; last.id = res.data.message_id || ''; }
        return updated;
      });
      setSources(res.data.sources || []);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') last.content = 'Désolé, une erreur est survenue. Veuillez réessayer.';
        return updated;
      });
    } finally {
      setStreaming(false);
      setStreamContent('');
    }
  };

  const rateMessage = async (messageId: string, sessionId: string, rating: number) => {
    if (ratedMessages[messageId]) return;
    try {
      await api.post('/professor/reactions', { message_id: messageId, session_id: sessionId, rating });
      setRatedMessages((prev) => ({ ...prev, [messageId]: rating }));
    } catch {}
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="relative w-[280px] h-full glass border-r border-nuit-600/50">
              <SidebarContent sessions={sessions} loadingSessions={loadingSessions} currentSessionId={currentSessionId}
                onSelect={(id) => { setSidebarOpen(false); navigate(`/chat/${id}`); }}
                onCreate={createSession} onDelete={deleteSession} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="border-r border-nuit-600/50 shrink-0 overflow-hidden">
              <div className="w-[280px] h-full">
                <SidebarContent sessions={sessions} loadingSessions={loadingSessions} currentSessionId={currentSessionId}
                  onSelect={(id) => navigate(`/chat/${id}`)} onCreate={createSession} onDelete={deleteSession} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — compact on mobile */}
        <div className="flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b border-nuit-600/50 shrink-0 min-h-[44px]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-colors">
            <MessageSquare size={16} />
          </button>
          <h2 className="text-sm font-medium text-white truncate max-w-[65%]">{sessionTitle}</h2>
          {currentSessionId && (
            <div className="flex items-center gap-3">
              <button onClick={() => downloadFile(`/exports/chat/${currentSessionId}/pdf`)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors" title="PDF" aria-label="Télécharger PDF">
                <Download size={14} className="sm:w-[15px]" />
              </button>
              <button onClick={() => downloadFile(`/exports/chat/${currentSessionId}/txt`)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors" title="TXT" aria-label="Télécharger TXT">
                <FileText size={14} className="sm:w-[15px]" />
              </button>
            </div>
          )}
        </div>

        {/* Messages — tighter mobile spacing */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-3 pb-28">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col min-h-full">
              {/* Empty state — distributed vertically */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 pt-6 sm:pt-10">
                {/* Compact welcome */}
                <div className="w-12 h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-emeraude-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 text-center">Besoin d'aide ?</h3>
                <p className="text-sm text-nuit-300 text-center max-w-xs leading-relaxed mb-4">
                  Posez votre question sur n'importe quelle matière. L'assistant IA répond en se basant sur vos cours.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 justify-center px-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i}
                      onClick={() => { sendMessage(s); }}
                      className="inline-block text-xs bg-[#11caa0]/5 text-[#11caa0] border border-[#11caa0]/20 rounded-full px-4 py-2 hover:bg-[#11caa0]/10 transition-colors cursor-pointer text-center max-w-full">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent sessions quick access */}
              {sessions.length > 0 && (
                <div className="shrink-0 px-2 pb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <History size={12} className="text-nuit-400" />
                    <span className="text-xs font-medium text-nuit-400">Reprendre une conversation</span>
                  </div>
                  <div className="space-y-1">
                    {sessions.slice(0, 3).map((s) => (
                      <button key={s.id} onClick={() => navigate(`/chat/${s.id}`)}
                        className="w-full text-left glass-light rounded-xl px-3 py-2.5 text-sm text-nuit-200 truncate hover:border-emeraude-500/20 hover:bg-white/[0.02] transition-colors flex items-center gap-2">
                        <MessageSquare size={13} className="shrink-0 text-nuit-400" />
                        <span className="truncate flex-1">{s.title}</span>
                        <ArrowRight size={13} className="shrink-0 text-nuit-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom spacer for scroll hint */}
              <div className="h-2" />
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-emeraude-400 animate-spin" />
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 sm:gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 self-start mt-1 ${msg.role === 'user' ? 'bg-emeraude-500/15' : 'bg-nuit-700'}`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emeraude-400" />
                    : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nuit-300" />}
                </div>
                <div className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 md:p-5 ${msg.role === 'user' ? 'bg-emeraude-500/10 border border-emeraude-500/20' : 'glass-light'}`}>
                  {msg.role === 'assistant' && !msg.content && streaming ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-emeraude-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-nuit-400 ml-1">Réflexion...</span>
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="text-sm sm:text-[15px] text-white leading-relaxed">{parseMarkdown(msg.content)}</div>
                  ) : (
                    <p className="text-sm sm:text-[15px] text-white whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.content && !streaming && msg.id && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-nuit-600/30">
                      <span className="text-[11px] text-nuit-400">Utile ?</span>
                      <button onClick={() => rateMessage(msg.id, currentSessionId!, 4)}
                        className={`p-1 rounded-md transition-colors ${ratedMessages[msg.id] === 4 ? 'text-emeraude-400 bg-emeraude-500/10' : 'text-nuit-400 hover:text-emeraude-400 hover:bg-emeraude-500/5'}`}
                        aria-label="Utile">
                        <ThumbsUp size={13} />
                      </button>
                      <button onClick={() => rateMessage(msg.id, currentSessionId!, 2)}
                        className={`p-1 rounded-md transition-colors ${ratedMessages[msg.id] === 2 ? 'text-danger bg-danger/10' : 'text-nuit-400 hover:text-danger hover:bg-danger/5'}`}
                        aria-label="Pas utile">
                        <ThumbsDown size={13} />
                      </button>
                      {ratedMessages[msg.id] && <span className="text-[11px] text-emeraude-400 ml-1">✓</span>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="px-3 sm:px-4 py-2 border-t border-nuit-600/50 shrink-0">
            <button onClick={() => setShowSources(!showSources)}
              className="text-xs text-emeraude-400 hover:text-emeraude-300 flex items-center gap-1">
              <BookOpen size={12} />
              {showSources ? 'Masquer' : 'Voir'} les sources ({sources.length})
              <ChevronDown size={11} className={`transition-transform ${showSources ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSources && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                    {sources.map((s, i) => (
                      <div key={i} className="text-xs text-nuit-300 glass-light rounded-lg p-2">
                        <p className="line-clamp-2 leading-relaxed">{s.content}</p>
                        {Boolean(s.metadata?.professeur) && <p className="text-emeraude-400 mt-0.5 text-[10px]">Par {String(s.metadata?.professeur || '')}</p>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Input — sticky footer with backdrop */}
        <div className="sticky bottom-0 bg-[#020617]/90 backdrop-blur-md border-t border-white/5 pt-3 pb-5 px-4"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex gap-2 items-end">
            <input type="text" value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1 min-w-0 min-h-[44px] px-4 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm sm:text-base focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all"
              placeholder="Posez votre question..." disabled={streaming} />
            <button onClick={() => sendMessage()} disabled={streaming || (!question.trim() && true)}
              className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 bg-emeraude-500 text-nuit-900 rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95 touch-manipulation"
              aria-label="Envoyer">
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
