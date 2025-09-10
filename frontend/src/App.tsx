import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Pages
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import AlertsPage from '@/pages/AlertsPage';
import ProfilePage from '@/pages/ProfilePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Components
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary, { NotFoundError } from '@/components/ErrorBoundary';

// Services
import { initializeSocket } from '@/services/socketService';

// Store
import { useAuthStore } from '@/store/authStore';

function App() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar autenticação
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Inicializar WebSocket se usuário estiver logado
    if (user) {
      initializeSocket();
    }
  }, [user]);

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
      {/* Rotas públicas */}
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />

      {/* Rotas protegidas */}
      <Route path='/' element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path='search' element={<SearchPage />} />
        <Route
          path='alerts'
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

        {/* Rota 404 */}
        <Route path='*' element={<NotFoundError />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
