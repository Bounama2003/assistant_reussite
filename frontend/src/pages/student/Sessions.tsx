import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Trash2, Download, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { ChatSession } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { downloadFile } from '@/lib/download';

export default function StudentSessions() {
  const { student } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    api.get(`/chat-sessions/student/${student.id}`)
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/chat-sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mes sessions</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">Historique de vos conversations</p>
        </div>
        <button onClick={() => navigate('/chat')}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Plus size={14} /> Chat
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400 pointer-events-none" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all"
          placeholder="Rechercher..." />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[72px] sm:h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-12 sm:py-14 px-4">
          <div className="w-12 h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-emeraude-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5">
            {search ? 'Aucun résultat' : 'Aucune conversation'}
          </h3>
          <p className="text-sm text-nuit-300 mb-5">
            {search ? 'Essayez un autre terme de recherche' : 'Commencez à discuter avec l\'assistant IA'}
          </p>
          {!search && (
            <button onClick={() => navigate('/chat')} className="btn-primary text-sm mx-auto flex items-center gap-2">
              <Plus size={15} /> Nouveau chat
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-2.5">
          {filtered.map((session, i) => (
            <motion.div key={session.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 shadow-sm hover:border-[#11caa0]/20 transition-all duration-200">

              {session.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{formatDateTime(session.created_at)}</span>
                </div>
              )}

              <div className="flex items-center gap-3 min-w-0 cursor-pointer"
                onClick={() => navigate(`/chat/${session.id}`)}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate pr-2">{session.title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <button onClick={(e) => { e.stopPropagation(); downloadFile(`/exports/chat/${session.id}/pdf`); }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emeraude-500/10 text-emeraude-400 hover:bg-emeraude-500/20 transition-colors"
                    title="Télécharger en PDF">
                    <Download size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} disabled={deleting === session.id}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Supprimer">
                    {deleting === session.id
                      ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
