import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/services/apiService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error?.message || 'Erro no login');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(email, password, name || email.split('@')[0]);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error?.message || 'Erro no registro');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignorar erros de logout, limpar estado local mesmo assim
          console.warn('Erro ao fazer logout:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token });
      },

      checkAuth: async () => {
        const state = get();
        if (!state.token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          // Tentar renovar o token
          const response = await authApi.refreshToken();
          
          if (response.success && response.data) {
            set({ 
              token: response.data.token,
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error('Token inválido');
          }
        } catch (error) {
          // Token inválido ou expirado
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
