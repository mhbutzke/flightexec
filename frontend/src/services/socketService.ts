import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    const { token } = useAuthStore.getState();

    if (this.socket?.connected) {
      return;
    }

    // Conecta ao servidor WebSocket
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket conectado:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
      this.isConnected = false;
    });

    this.socket.on('connect_error', error => {
      console.error('Erro de conexão do socket:', error);
    });

    // Listeners para notificações de alertas
    this.socket.on('alert_triggered', data => {
      console.log('Alerta disparado:', data);
      // Aqui você pode adicionar lógica para mostrar notificações
      this.showNotification('Alerta de Voo', data.message);
    });

    this.socket.on('price_update', data => {
      console.log('Atualização de preço:', data);
      // Aqui você pode atualizar o estado da aplicação
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  private showNotification(title: string, message: string) {
    // Verifica se o navegador suporta notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    } else if (
      'Notification' in window &&
      Notification.permission !== 'denied'
    ) {
      // Solicita permissão para notificações
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico',
          });
        }
      });
    }
  }
}

// Instância singleton do serviço de socket
const socketService = new SocketService();

// Função para inicializar o socket
export const initializeSocket = () => {
  socketService.connect();
};

// Função para desconectar o socket
export const disconnectSocket = () => {
  socketService.disconnect();
};

export default socketService;
