import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);

    // Callback personalizado para tratamento de erro
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enviar erro para serviço de monitoramento (ex: Sentry)
    if (import.meta.env.PROD) {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar UI de erro padrão
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Algo deu errado
                </h2>
                <p className="text-gray-600 mb-6">
                  Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
                </p>

                {import.meta.env.DEV && this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Detalhes do erro (apenas em desenvolvimento):
                    </h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir para Início
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook para capturar erros em componentes funcionais
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Erro capturado:', error, errorInfo);
    
    // Em produção, enviar para serviço de monitoramento
    if (import.meta.env.PROD) {
      // Sentry.captureException(error);
    }
  };
};

// Componente de erro para rotas não encontradas
export const NotFoundError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Página não encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              A página que você está procurando não existe ou foi movida.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de erro para falhas de rede
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Erro de Conexão
          </h3>
          <p className="mt-1 text-sm text-red-700">
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};