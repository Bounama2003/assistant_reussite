import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  guideOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setGuideOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  theme: 'dark',
  guideOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setGuideOpen: (open) => set({ guideOpen: open }),
}));
