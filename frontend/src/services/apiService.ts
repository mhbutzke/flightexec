import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Interface para respostas padronizadas da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
    stack?: string;
  };
  timestamp?: string;
}

// Interface para respostas paginadas
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore.getState();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log da requisição em desenvolvimento
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Erro na configuração da requisição:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - tratar respostas e erros
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log da resposta em desenvolvimento
        if (import.meta.env.DEV) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      (error) => {
        // Log do erro em desenvolvimento
        if (import.meta.env.DEV) {
          console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }

        // Tratar erro 401 - token expirado
        if (error.response?.status === 401) {
          const { logout } = useAuthStore.getState();
          logout();
          
          // Redirecionar para login apenas se não estiver já na página de login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP genéricos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Método para upload de arquivos
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.api.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  }

  // Método para download de arquivos
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Método para cancelar requisições
  createCancelToken() {
    return axios.CancelToken.source();
  }

  // Método para verificar se um erro é de cancelamento
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  // Getter para acessar a instância do axios diretamente se necessário
  get instance(): AxiosInstance {
    return this.api;
  }
}

// Instância singleton do serviço de API
const apiService = new ApiService();

export default apiService;

// Interfaces para tipos de dados comuns
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  classType: string;
  availableSeats: number;
  aircraft?: string;
  stops?: number;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  classType: string;
  flexibleDays?: number;
}

export interface Alert {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  maxPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Funções de conveniência para endpoints específicos
export const authApi = {
  login: (email: string, password: string) => 
    apiService.post<{ user: User; token: string }>('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) => 
    apiService.post<{ user: User; token: string }>('/auth/register', { email, password, name }),
  
  logout: () => 
    apiService.post('/auth/logout'),
  
  refreshToken: () => 
    apiService.post<{ token: string }>('/auth/refresh'),
  
  forgotPassword: (email: string) => 
    apiService.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    apiService.post('/auth/reset-password', { token, password }),
  
  verifyEmail: (token: string) => 
    apiService.post('/auth/verify-email', { token }),
};

export const flightApi = {
  search: (params: FlightSearchParams) => 
    apiService.post<Flight[]>('/flights/search', params),
  
  searchFlexible: (params: FlightSearchParams) => 
    apiService.post<{
      flights: Flight[];
      priceCalendar: any[];
      recommendations: any[];
    }>('/flights/search-flexible', params),
  
  getById: (id: string) => 
    apiService.get<Flight>(`/flights/${id}`),
  
  getPopularDestinations: () => 
    apiService.get<any[]>('/flights/popular-destinations'),
};

export const alertApi = {
  getAll: (page = 1, limit = 10) => 
    apiService.get<PaginatedResponse<Alert>>(`/alerts?page=${page}&limit=${limit}`),
  
  create: (alert: Omit<Alert, 'id' | 'userId' | 'createdAt'>) => 
    apiService.post<Alert>('/alerts', alert),
  
  update: (id: string, alert: Partial<Alert>) => 
    apiService.put<Alert>(`/alerts/${id}`, alert),
  
  delete: (id: string) => 
    apiService.delete(`/alerts/${id}`),
  
  toggle: (id: string) => 
    apiService.patch<Alert>(`/alerts/${id}/toggle`),
};

export const userApi = {
  getProfile: () => 
    apiService.get<User>('/users/profile'),
  
  updateProfile: (data: Partial<User>) => 
    apiService.put<User>('/users/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    apiService.post('/users/change-password', { currentPassword, newPassword }),
  
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) => 
    apiService.upload<{ avatarUrl: string }>('/users/avatar', file, onProgress),
  
  deleteAccount: () => 
    apiService.delete('/users/account'),
};