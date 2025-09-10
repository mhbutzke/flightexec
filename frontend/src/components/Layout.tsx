import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  PlaneTakeoff,
  Search,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { SkipLinks, AccessibleBreadcrumb, useFocusManagement } from './AccessibilityHelpers';
import { PageLoader } from './LoadingSpinner';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthStore();
  const { focusRef } = useFocusManagement();

  // Fechar menus ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Início', href: '/', icon: PlaneTakeoff },
    { name: 'Buscar', href: '/search', icon: Search },
    { name: 'Alertas', href: '/alerts', icon: Bell },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Gerar breadcrumbs baseado na rota atual
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Início', href: '/' }];
    
    const routeMap: Record<string, string> = {
      search: 'Buscar Voos',
      alerts: 'Alertas de Preço',
      profile: 'Perfil'
    };
    
    pathSegments.forEach((segment, index) => {
      const label = routeMap[segment] || segment;
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const current = index === pathSegments.length - 1;
      
      const breadcrumbItem: any = { label, current };
      if (!current) {
        breadcrumbItem.href = href;
      }
      breadcrumbs.push(breadcrumbItem);
    });
    
    return breadcrumbs.length > 1 ? breadcrumbs : [];
  };

  if (isLoading) {
    return <PageLoader text="Carregando aplicação..." />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <SkipLinks />
      
      {/* Navigation */}
      <nav id="navigation" className='bg-white shadow-sm border-b border-gray-200' role="navigation" aria-label="Navegação principal">
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <Link to='/' className='flex items-center gap-2'>
                <PlaneTakeoff className='w-8 h-8 text-blue-600' />
                <span className='text-xl font-bold text-gray-900'>
                  FlightExec
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-8'>
              {navigation.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className='flex items-center gap-4'>
              {user ? (
                <div className='relative'>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'
                  >
                    <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                      <User className='w-4 h-4 text-white' />
                    </div>
                    <span className='hidden md:block text-sm font-medium text-gray-700'>
                      {user.name || user.email}
                    </span>
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'
                      >
                        <Link
                          to='/profile'
                          className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className='w-4 h-4' />
                          Perfil
                        </Link>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className='flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                        >
                          <LogOut className='w-4 h-4' />
                          Sair
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Link
                    to='/login'
                    className='text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Entrar
                  </Link>
                  <Link
                    to='/register'
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Cadastrar
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'
              >
                {isMobileMenuOpen ? (
                  <X className='w-6 h-6' />
                ) : (
                  <Menu className='w-6 h-6' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='md:hidden border-t border-gray-200 bg-white'
            >
              <div className='px-4 py-2 space-y-1'>
                {navigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className='w-5 h-5' />
                      {item.name}
                    </Link>
                  );
                })}

                {user && (
                  <>
                    <div className='border-t border-gray-200 my-2' />
                    <Link
                      to='/profile'
                      onClick={() => setIsMobileMenuOpen(false)}
                      className='flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors'
                    >
                      <Settings className='w-5 h-5' />
                      Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className='flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors'
                    >
                      <LogOut className='w-5 h-5' />
                      Sair
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main id="main-content" className='flex-1' ref={focusRef} tabIndex={-1}>
        {/* Breadcrumb */}
        {getBreadcrumbs().length > 0 && (
          <div className='bg-white border-b border-gray-200'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3'>
              <AccessibleBreadcrumb items={getBreadcrumbs()} />
            </div>
          </div>
        )}
        
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <Outlet />
        </div>
      </main>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;
