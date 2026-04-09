import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  churchId: string | null;
  role: string | null;

  setAuth: (user: User, churchId?: string, role?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  churchId: null,
  role: null,

  setAuth: (user, churchId, role) =>
    set({
      user,
      isAuthenticated: true,
      churchId: churchId || null,
      role: role || null,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      churchId: null,
      role: null,
    }),
}));
