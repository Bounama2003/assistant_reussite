import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Student, Professor, School } from '@/types';

export type AuthRole = 'lead' | 'student' | 'professor' | 'admin' | 'superadmin' | null;

interface AuthState {
  role: AuthRole;
  school: School | null;
  student: Student | null;
  professor: Professor | null;
  studentId: string | null;
  adminKey: string | null;
  professorKey: string | null;
  superAdminKey: string | null;
  schoolId: string | null;

  setSchool: (school: School) => void;
  setStudent: (student: Student, school: School) => void;
  setProfessor: (professor: Professor) => void;
  setAdmin: (adminKey: string, school: School) => void;
  setSuperAdmin: (key: string) => void;
  setLead: (school: School) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: null,
      school: null,
      student: null,
      professor: null,
      studentId: null,
      adminKey: null,
      professorKey: null,
      superAdminKey: null,
      schoolId: null,

      setSchool: (school) =>
        set({ school, schoolId: school.id }),

      setStudent: (student, school) =>
        set({
          role: 'student',
          student,
          studentId: student.id,
          school,
          schoolId: school.id,
          adminKey: null,
          professorKey: null,
          superAdminKey: null,
          professor: null,
        }),

      setProfessor: (professor) =>
        set({
          role: 'professor',
          professor,
          professorKey: professor.professor_key,
          schoolId: professor.school_id,
          student: null,
          studentId: null,
          adminKey: null,
          superAdminKey: null,
        }),

      setAdmin: (adminKey, school) =>
        set({
          role: 'admin',
          adminKey,
          school,
          schoolId: school.id,
          student: null,
          studentId: null,
          professorKey: null,
          superAdminKey: null,
          professor: null,
        }),

      setSuperAdmin: (key) =>
        set({
          role: 'superadmin',
          superAdminKey: key,
          school: null,
          schoolId: null,
          student: null,
          studentId: null,
          adminKey: null,
          professorKey: null,
          professor: null,
        }),

      setLead: (school) =>
        set({
          role: 'lead',
          school,
          schoolId: school.id,
          student: null,
          studentId: null,
          adminKey: null,
          professorKey: null,
          superAdminKey: null,
          professor: null,
        }),

      logout: () =>
        set({
          role: null,
          school: null,
          student: null,
          professor: null,
          studentId: null,
          adminKey: null,
          professorKey: null,
          superAdminKey: null,
          schoolId: null,
        }),

      isAuthenticated: () => {
        const state = get();
        return !!(state.role && (state.studentId || state.adminKey || state.professorKey || state.superAdminKey));
      },
    }),
    {
      name: 'assistant-reussite-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
