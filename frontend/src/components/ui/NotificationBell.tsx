import { useState, useEffect, useRef } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `il y a ${hour}h`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `il y a ${day}j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const count = unreadCount();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count} non lues)` : ""}`}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emeraude-500 text-[10px] font-bold text-nuit-900 px-1 leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 sm:hidden bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed top-[72px] left-4 right-4 z-50 max-h-[60vh] sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-80 sm:max-h-none bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/40 flex flex-col"
          >
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 shrink-0">
              <Bell size={16} className="text-emeraude-400 shrink-0" />
              <span className="text-sm font-semibold text-white flex-1 truncate">
                Notifications
              </span>
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-emeraude-400 hover:text-emeraude-300 transition-colors shrink-0 whitespace-nowrap"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Tout marquer comme lu</span>
                  <span className="sm:hidden">Marquer lu</span>
                </button>
              )}
            </div>

            <div className="overflow-y-auto min-h-0 -mx-4 px-4">
              {items.length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center flex flex-col items-center justify-center gap-2">
                  <BellOff size={24} className="text-slate-500/60" />
                  <span>Aucune notification</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.url) window.open(n.url, "_blank");
                      }}
                      className={`w-full text-left py-3 transition-colors hover:bg-white/[0.03] ${
                        n.read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5 px-4">
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-emeraude-500" />
                        )}
                        <div className={`flex-1 min-w-0 ${n.read ? "ml-[18px]" : ""}`}>
                          <p className="text-sm font-medium text-white truncate leading-snug">
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-nuit-300 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[11px] text-nuit-500 mt-1">
                            {timeAgo(n.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
