import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// Hook para anúncios de tela
export const useScreenReader = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove após 1 segundo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return { announce };
};

// Hook para foco automático
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement>(null);
  
  const focusElement = (element?: HTMLElement) => {
    const target = element || focusRef.current;
    if (target) {
      target.focus();
    }
  };
  
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };
  
  return { focusRef, focusElement, trapFocus };
};

// Componente de Skip Links
export const SkipLinks = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 p-2 bg-blue-600 text-white rounded-br focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-32 z-50 p-2 bg-blue-600 text-white rounded-br focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Pular para a navegação
      </a>
    </div>
  );
};

// Componente de Status/Feedback acessível
interface AccessibleStatusProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const AccessibleStatus = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}: AccessibleStatusProps) => {
  const { announce } = useScreenReader();
  
  useEffect(() => {
    if (isVisible) {
      announce(message, type === 'error' ? 'assertive' : 'polite');
      
      if (autoClose && onClose) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, message, type, announce, autoClose, onClose, duration]);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };
  
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border ${getColors()} shadow-lg`}
          role="alert"
          aria-live={type === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente de Loading acessível
interface AccessibleLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleLoading = ({
  isLoading,
  loadingText = 'Carregando...',
  children
}: AccessibleLoadingProps) => {
  return (
    <div className="relative">
      {isLoading && (
        <div
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10"
          aria-live="polite"
          aria-busy="true"
          aria-label={loadingText}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">{loadingText}</p>
          </div>
        </div>
      )}
      <div aria-hidden={isLoading}>
        {children}
      </div>
    </div>
  );
};

// Componente de Breadcrumb acessível
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const AccessibleBreadcrumb = ({ items }: AccessibleBreadcrumbProps) => {
  return (
    <nav aria-label="Navegação estrutural" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">/</span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={item.current ? 'text-gray-900 font-medium' : 'text-gray-600'}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default {
  useScreenReader,
  useFocusManagement,
  SkipLinks,
  AccessibleStatus,
  AccessibleLoading,
  AccessibleBreadcrumb
};