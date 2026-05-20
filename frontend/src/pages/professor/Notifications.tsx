import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ThumbsDown, FileText, AlertCircle, Info, Clock, CheckCheck, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import api from '@/services/api';
import type { Notification } from '@/types';
import { formatDateTime } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  negative_feedback: ThumbsDown,
  document_upload: FileText,
};

const typeColors: Record<string, string> = {
  negative_feedback: 'text-danger bg-danger/10',
  document_upload: 'text-emeraude-400 bg-emeraude-500/10',
};

export default function ProfessorNotifications() {
  const { professorKey } = useAuthStore();
  const [serverNotifs, setServerNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const pushItems = useNotificationStore((s) => s.items);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearPush = useNotificationStore((s) => s.clear);

  useEffect(() => {
    if (!professorKey) return;
    api.get('/professor/notifications', { params: { limit: 20 }, headers: { 'X-Professor-Key': professorKey } })
      .then((res) => setServerNotifs(res.data))
      .catch(e => console.error("Notif error", e))
      .finally(() => setLoading(false));
  }, [professorKey]);

  const pushUnread = pushItems.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-nuit-300 text-sm">
          {pushUnread > 0
            ? `${pushUnread} notification${pushUnread > 1 ? 's' : ''} non lue${pushUnread > 1 ? 's' : ''}`
            : 'Restez informé de votre activité'}
        </p>
      </div>

      {pushItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-emeraude-400 uppercase tracking-wider">Temps réel</h2>
            <div className="flex gap-2">
              {pushUnread > 0 && (
                <button onClick={markAllAsRead} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-emeraude-500/10 text-emeraude-400 hover:bg-emeraude-500/20 transition-colors">
                  <CheckCheck size={12} />
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={clearPush} className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                <Trash2 size={12} />
                Effacer
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {pushItems.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-hover flex items-start gap-4 py-4 cursor-pointer ${!n.read ? 'border-l-2 border-emeraude-400' : ''}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-emeraude-500/10 text-emeraude-400' : 'bg-nuit-700 text-nuit-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-nuit-300'}`}>
                    {n.title}
                    {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-emeraude-400 ml-2 align-middle" />}
                  </h4>
                  <p className="text-sm text-nuit-400 mt-0.5 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={11} className="text-nuit-500" />
                    <p className="text-xs text-nuit-500">{formatRelativeTime(n.timestamp)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-nuit-400 uppercase tracking-wider mb-3">
          Historique
          {loading && <span className="ml-2 text-xs font-normal animate-pulse">Chargement...</span>}
        </h2>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}</div>
        ) : serverNotifs.length === 0 && pushItems.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-12 h-12 text-nuit-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucune notification</h3>
            <p className="text-nuit-300 text-sm">Vous serez notifié ici des retours et activités</p>
          </div>
        ) : (
          <div className="space-y-2">
            {serverNotifs.map((n, i) => {
              const Icon = typeIcons[n.type] || Info;
              const color = typeColors[n.type] || 'text-nuit-300 bg-nuit-700';
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hover flex items-start gap-4 py-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                    <p className="text-sm text-nuit-300 mt-0.5">{n.message}</p>
                    {n.created_at && (
                      <p className="text-xs text-nuit-400 mt-1">{formatDateTime(n.created_at)}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString('fr-FR');
}
