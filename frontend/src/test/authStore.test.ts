import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      role: null,
      school: null,
      student: null,
      studentId: null,
      adminKey: null,
      professorKey: null,
      superAdminKey: null,
      schoolId: null,
      professor: null,
    });
  });

  it('starts with null role', () => {
    const state = useAuthStore.getState();
    expect(state.role).toBeNull();
  });

  it('setStudent updates role and student', () => {
    const state = useAuthStore.getState();
    state.setStudent(
      { id: 'stu-1', name: 'Test', school_id: 'school-1', is_active: true } as any,
      { id: 'school-1', name: 'School 1', primary_color: '#000' } as any,
    );

    const updated = useAuthStore.getState();
    expect(updated.role).toBe('student');
    expect(updated.studentId).toBe('stu-1');
    expect(updated.schoolId).toBe('school-1');
  });

  it('setAdmin updates role and adminKey', () => {
    const state = useAuthStore.getState();
    state.setAdmin('admin-key-123', { id: 'school-1', name: 'School' } as any);

    const updated = useAuthStore.getState();
    expect(updated.role).toBe('admin');
    expect(updated.adminKey).toBe('admin-key-123');
  });

  it('logout resets all state', () => {
    useAuthStore.setState({
      role: 'admin',
      adminKey: 'admin-key-123',
      schoolId: 'school-1',
    });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.role).toBeNull();
    expect(state.adminKey).toBeNull();
    expect(state.schoolId).toBeNull();
  });

  it('isAuthenticated returns true for valid auth', () => {
    useAuthStore.setState({ role: 'student', studentId: 'stu-1' });
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when not logged in', () => {
    useAuthStore.setState({ role: null, studentId: null });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
