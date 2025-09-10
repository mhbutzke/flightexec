import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface FlightAlert {
  id: string;
  title: string;
  message: string;
  flightData: any;
  triggerType: 'price_drop' | 'new_deal' | 'availability';
  timestamp: string;
}

interface PriceUpdate {
  flightId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  timestamp: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info('Serviço WebSocket inicializado');
  }

  // Configurar middleware de autenticação
  private setupMiddleware(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          logger.warn(`Conexão WebSocket rejeitada: token não fornecido`);
          return next(new Error('Token de autenticação necessário'));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as any;

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          logger.warn(
            `Conexão WebSocket rejeitada: usuário ${decoded.userId} não encontrado ou inativo`
          );
          return next(new Error('Usuário não autorizado'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        logger.error('Erro na autenticação WebSocket:', error);
        next(new Error('Token inválido'));
      }
    });
  }

  // Configurar manipuladores de eventos
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  // Manipular nova conexão
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const userName = socket.user?.name || 'Usuário';

    logger.info(`Usuário ${userName} (${userId}) conectado via WebSocket`);

    // Armazenar conexão
    this.connectedUsers.set(userId, socket.id);

    // Juntar usuário ao seu room pessoal
    socket.join(`user-${userId}`);

    // Enviar confirmação de conexão
    socket.emit('connected', {
      message: 'Conectado com sucesso',
      userId,
      timestamp: new Date().toISOString(),
    });

    // Manipular eventos do cliente
    this.setupClientEventHandlers(socket);

    // Manipular desconexão
    socket.on('disconnect', reason => {
      logger.info(`Usuário ${userName} (${userId}) desconectado: ${reason}`);
      this.connectedUsers.delete(userId);
    });
  }

  // Configurar manipuladores de eventos do cliente
  private setupClientEventHandlers(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    // Subscrever a alertas específicos
    socket.on('subscribe-alerts', async (alertIds: string[]) => {
      try {
        // Verificar se os alertas pertencem ao usuário
        const userAlerts = await prisma.alert.findMany({
          where: {
            id: { in: alertIds },
            userId,
          },
          select: { id: true },
        });

        const validAlertIds = userAlerts.map(alert => alert.id);

        // Juntar aos rooms dos alertas
        validAlertIds.forEach(alertId => {
          socket.join(`alert-${alertId}`);
        });

        socket.emit('alerts-subscribed', {
          subscribedAlerts: validAlertIds,
          timestamp: new Date().toISOString(),
        });

        logger.info(
          `Usuário ${userId} subscrito a ${validAlertIds.length} alertas`
        );
      } catch (error) {
        logger.error('Erro ao subscrever alertas:', error);
        socket.emit('error', { message: 'Erro ao subscrever alertas' });
      }
    });

    // Dessuscrever de alertas
    socket.on('unsubscribe-alerts', (alertIds: string[]) => {
      alertIds.forEach(alertId => {
        socket.leave(`alert-${alertId}`);
      });

      socket.emit('alerts-unsubscribed', {
        unsubscribedAlerts: alertIds,
        timestamp: new Date().toISOString(),
      });

      logger.info(
        `Usuário ${userId} dessubscrito de ${alertIds.length} alertas`
      );
    });

    // Buscar status de voos em tempo real
    socket.on('track-flight', (flightId: string) => {
      socket.join(`flight-${flightId}`);
      socket.emit('flight-tracking-started', {
        flightId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Usuário ${userId} rastreando voo ${flightId}`);
    });

    // Parar rastreamento de voo
    socket.on('untrack-flight', (flightId: string) => {
      socket.leave(`flight-${flightId}`);
      socket.emit('flight-tracking-stopped', {
        flightId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Usuário ${userId} parou de rastrear voo ${flightId}`);
    });

    // Ping/Pong para manter conexão viva
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  // Enviar alerta de voo para usuário específico
  sendFlightAlert(userId: string, alert: FlightAlert): void {
    try {
      this.io.to(`user-${userId}`).emit('flight-alert', alert);
      logger.info(
        `Alerta de voo enviado para usuário ${userId}: ${alert.title}`
      );
    } catch (error) {
      logger.error('Erro ao enviar alerta de voo:', error);
    }
  }

  // Enviar atualização de preço para todos os interessados
  sendPriceUpdate(flightId: string, priceUpdate: PriceUpdate): void {
    try {
      this.io.to(`flight-${flightId}`).emit('price-update', priceUpdate);
      logger.info(
        `Atualização de preço enviada para voo ${flightId}: ${priceUpdate.oldPrice} -> ${priceUpdate.newPrice}`
      );
    } catch (error) {
      logger.error('Erro ao enviar atualização de preço:', error);
    }
  }

  // Enviar notificação geral para usuário
  sendNotification(userId: string, notification: any): void {
    try {
      this.io.to(`user-${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
      logger.info(`Notificação enviada para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
    }
  }

  // Broadcast para todos os usuários conectados
  broadcast(event: string, data: any): void {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      logger.info(`Broadcast enviado: ${event}`);
    } catch (error) {
      logger.error('Erro ao enviar broadcast:', error);
    }
  }

  // Enviar mensagem para room específico
  sendToRoom(room: string, event: string, data: any): void {
    try {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      logger.info(`Mensagem enviada para room ${room}: ${event}`);
    } catch (error) {
      logger.error('Erro ao enviar mensagem para room:', error);
    }
  }

  // Verificar se usuário está conectado
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Obter número de usuários conectados
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Obter lista de usuários conectados
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Desconectar usuário específico
  disconnectUser(userId: string, reason?: string): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        logger.info(
          `Usuário ${userId} desconectado forçadamente: ${reason || 'Sem motivo especificado'}`
        );
      }
    }
  }

  // Obter instância do Socket.IO
  getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketService;
export { SocketService, FlightAlert, PriceUpdate };
