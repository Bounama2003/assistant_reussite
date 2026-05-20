import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentLogin from '@/pages/auth/StudentLogin';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    setStudent: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('StudentLogin', () => {
  it('renders login form', () => {
    render(
      <MemoryRouter>
        <StudentLogin />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Connexion Élève')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+221771234567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });
});
