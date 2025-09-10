import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

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

export const useAuthStore = create<AuthState>()(  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Simulação de login - substituir pela API real
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            createdAt: new Date().toISOString()
          };
          
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          set({ 
            user: mockUser, 
            token: mockToken, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
          // Simulação de registro - substituir pela API real
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: '1',
            email,
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString()
          };
          
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          set({ 
            user: mockUser, 
            token: mockToken, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
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
          // Simulação de verificação de token - substituir pela API real
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Se chegou até aqui, o token é válido
          set({ isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Token inválido
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);