import { create } from "zustand";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  url?: string;
}

interface NotificationState {
  items: PushNotification[];
  addNotification: (title: string, body: string, url?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  unreadCount: () => number;
}

let counter = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],

  addNotification: (title, body, url) => {
    const id = `push-${Date.now()}-${++counter}`;
    const notif: PushNotification = { id, title, body, timestamp: Date.now(), read: false, url };
    set((s) => ({ items: [notif, ...s.items].slice(0, 50) }));
  },

  markAsRead: (id) => {
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllAsRead: () => {
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
    }));
  },

  clear: () => set({ items: [] }),

  unreadCount: () => get().items.filter((n) => !n.read).length,
}));
