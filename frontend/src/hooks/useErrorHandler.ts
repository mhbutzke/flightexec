import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Tipos de erro personalizados
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

// Mapeamento de códigos de status HTTP para tipos de erro
const getErrorTypeFromStatus = (status: number): ErrorType => {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 409:
      return ErrorType.CONFLICT;
    case 429:
      return ErrorType.RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
};

// Mensagens de erro amigáveis
const getErrorMessage = (errorType: ErrorType, originalMessage?: string): string => {
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    case ErrorType.AUTHENTICATION:
      return 'Sessão expirada. Faça login novamente.';
    case ErrorType.AUTHORIZATION:
      return 'Você não tem permissão para realizar esta ação.';
    case ErrorType.VALIDATION:
      return originalMessage || 'Dados inválidos. Verifique as informações e tente novamente.';
    case ErrorType.NOT_FOUND:
      return 'Recurso não encontrado.';
    case ErrorType.CONFLICT:
      return originalMessage || 'Conflito de dados. Este registro já existe.';
    case ErrorType.RATE_LIMIT:
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    case ErrorType.SERVER:
      return 'Erro interno do servidor. Tente novamente em alguns minutos.';
    default:
      return originalMessage || 'Ocorreu um erro inesperado. Tente novamente.';
  }
};

// Hook principal para tratamento de erros
export const useErrorHandler = () => {
  const handleError = useCallback((error: any, showToast: boolean = true) => {
    let errorType: ErrorType;
    let message: string;
    let statusCode: number | undefined;

    // Erro de rede (sem resposta do servidor)
    if (!error.response) {
      errorType = ErrorType.NETWORK;
      message = getErrorMessage(ErrorType.NETWORK);
      statusCode = undefined;
    }
    // Erro com resposta do servidor
    else {
      statusCode = error.response.status || 500;
      errorType = getErrorTypeFromStatus(statusCode);
      
      // Tentar extrair mensagem da resposta da API
      const apiError = error.response.data as ApiErrorResponse;
      const originalMessage = apiError?.error?.message || error.message;
      
      message = getErrorMessage(errorType, originalMessage);
    }

    // Log do erro para desenvolvimento
    if (import.meta.env.DEV) {
      console.error('Erro capturado:', {
        type: errorType,
        message,
        statusCode,
        originalError: error,
      });
    }

    // Mostrar toast de erro
    if (showToast) {
      toast.error(message, {
        duration: errorType === ErrorType.NETWORK ? 6000 : 4000,
        position: 'top-right',
      });
    }

    // Ações específicas baseadas no tipo de erro
    switch (errorType) {
      case ErrorType.AUTHENTICATION:
        // Redirecionar para login após um delay
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        break;
      
      case ErrorType.RATE_LIMIT:
        // Implementar backoff exponencial se necessário
        break;
    }

    return {
      type: errorType,
      message,
      statusCode,
      originalError: error,
    };
  }, []);

  // Função específica para erros de API
  const handleApiError = useCallback((error: any, customMessage?: string) => {
    const result = handleError(error, false);
    
    if (customMessage) {
      toast.error(customMessage);
    } else {
      toast.error(result.message);
    }
    
    return result;
  }, [handleError]);

  // Função para mostrar erros de validação de formulário
  const handleValidationError = useCallback((errors: Record<string, string[]>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    toast.error(`Erro de validação: ${errorMessages}`, {
      duration: 6000,
    });
    
    return {
      type: ErrorType.VALIDATION,
      message: errorMessages,
      errors,
    };
  }, []);

  // Função para mostrar mensagens de sucesso
  const showSuccess = useCallback((message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  // Função para mostrar mensagens de informação
  const showInfo = useCallback((message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  }, []);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    showSuccess,
    showInfo,
  };
};

// Hook para retry automático com backoff exponencial
export const useRetry = () => {
  const { handleError } = useErrorHandler();

  const retry = useCallback(async (
    fn: () => Promise<any>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ) => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Se é o último attempt, não fazer retry
        if (attempt === maxAttempts) {
          break;
        }
        
        // Calcular delay com backoff exponencial
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Log do retry
        if (import.meta.env.DEV) {
          console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    handleError(lastError);
    throw lastError;
  }, [handleError]);

  return { retry };
};

// Wrapper para requisições com tratamento de erro automático
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  customErrorMessage?: string
) => {
  const { handleApiError } = useErrorHandler();
  
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, customErrorMessage);
      return null;
    }
  };
};