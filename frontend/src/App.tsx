import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

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
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rotas protegidas */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route 
          path="alerts" 
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-8">Página não encontrada</p>
            <a 
              href="/" 
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;