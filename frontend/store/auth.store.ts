import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'TECNICO' | 'SOLICITANTE';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  area?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, loading: false }),
}));
