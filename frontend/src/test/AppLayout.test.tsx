import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ role: null }),
}));

vi.mock('@/stores/appStore', () => ({
  useAppStore: () => ({
    sidebarOpen: true,
    guideOpen: false,
    setGuideOpen: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: () => {},
}));

vi.mock('@/components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, Outlet: () => <div data-testid="outlet-fallback" /> };
});

describe('AppLayout', () => {
  it('renders outlet for unauthenticated (lead) users', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('outlet-fallback')).toBeInTheDocument();
  });
});
