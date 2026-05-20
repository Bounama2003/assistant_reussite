import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { items, markAsRead, markAllAsRead, clear } = useNotificationStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-nuit-300 text-sm">
            {items.filter((n) => !n.read).length} non lue{items.filter((n) => !n.read).length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {items.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emeraude-500/10 text-emeraude-400 hover:bg-emeraude-500/20 transition-colors"
            >
              <CheckCheck size={14} />
              Tout marquer comme lu
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              <Trash2 size={14} />
              Effacer tout
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-16 h-16 text-nuit-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune notification</h3>
          <p className="text-nuit-300 text-sm max-w-md mx-auto">
            Les notifications push reçues via votre navigateur apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.url) navigate(n.url);
                }}
                className={`card-hover flex items-start gap-4 py-4 cursor-pointer ${
                  !n.read ? 'border-l-2 border-emeraude-400' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.read
                    ? 'bg-emeraude-500/10 text-emeraude-400'
                    : 'bg-nuit-700 text-nuit-400'
                }`}>
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
                    <p className="text-xs text-nuit-500">
                      {formatRelativeTime(n.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
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
