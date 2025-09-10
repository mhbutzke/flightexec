import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type:
    | 'price_alert'
    | 'flight_delay'
    | 'booking_confirmation'
    | 'system_update';
  title: string;
  message: string;
  metadata?: any;
  priority?: 'low' | 'medium' | 'high';
  channels?: ('email' | 'push' | 'sms')[];
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  priceAlerts: boolean;
  flightUpdates: boolean;
  systemUpdates: boolean;
}

class NotificationService {
  // Criar notificação
  async createNotification(data: NotificationData): Promise<any> {
    try {
      // Buscar preferências do usuário
      const userPreferences = await this.getUserPreferences(data.userId);

      // Verificar se o usuário quer receber este tipo de notificação
      if (!this.shouldSendNotification(data.type, userPreferences)) {
        logger.info(
          `Notificação não enviada - usuário ${data.userId} desabilitou ${data.type}`
        );
        return null;
      }

      // Criar notificação no banco (usando o modelo Alert-Notification)
      // Primeiro, precisamos de um alerta para criar a notificação
      const notification = await prisma.notification.create({
        data: {
          alertId: data.metadata?.alertId || 'system', // Usar alertId do metadata ou 'system'
          title: data.title,
          message: data.message,
          type: data.type,
          status: 'pending',
        },
      });

      // Enviar através dos canais apropriados
      await this.sendThroughChannels(
        notification,
        data.channels || ['push'],
        userPreferences
      );

      logger.info(`Notificação criada para usuário ${data.userId}`, {
        notificationId: notification.id,
        type: data.type,
      });

      return notification;
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
      throw new Error('Falha ao criar notificação');
    }
  }

  // Buscar preferências do usuário
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // Retornar preferências padrão se usuário não encontrado
        return {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          priceAlerts: true,
          flightUpdates: true,
          systemUpdates: true,
        };
      }

      // Como o schema não tem campos de preferências, usar padrões
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        priceAlerts: true,
        flightUpdates: true,
        systemUpdates: true,
      };
    } catch (error) {
      logger.error('Erro ao buscar preferências do usuário:', error);
      // Retornar preferências padrão em caso de erro
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        priceAlerts: true,
        flightUpdates: true,
        systemUpdates: true,
      };
    }
  }

  // Verificar se deve enviar notificação baseado nas preferências
  private shouldSendNotification(
    type: string,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'price_alert':
        return preferences.priceAlerts;
      case 'flight_delay':
      case 'booking_confirmation':
        return preferences.flightUpdates;
      case 'system_update':
        return preferences.systemUpdates;
      default:
        return true;
    }
  }

  // Enviar notificação através dos canais especificados
  private async sendThroughChannels(
    notification: any,
    channels: string[],
    preferences: NotificationPreferences
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (preferences.emailNotifications) {
            promises.push(this.sendEmailNotification(notification));
          }
          break;
        case 'push':
          if (preferences.pushNotifications) {
            promises.push(this.sendPushNotification(notification));
          }
          break;
        case 'sms':
          if (preferences.smsNotifications) {
            promises.push(this.sendSMSNotification(notification));
          }
          break;
      }
    }

    // Executar todos os envios em paralelo
    await Promise.allSettled(promises);
  }

  // Enviar notificação por email
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true },
      });

      if (!user?.email) {
        logger.warn(`Usuário ${notification.userId} não tem email cadastrado`);
        return;
      }

      // Enviar email usando o método disponível no emailService
      await emailService.sendAlertEmail({
        to: user.email,
        userName: user.name || 'Usuário',
        alertName: notification.title,
        flightData: { message: notification.message },
        triggerType: 'price_drop',
      });

      logger.info(`Email de notificação enviado para ${user.email}`);
    } catch (error) {
      logger.error('Erro ao enviar email de notificação:', error);
    }
  }

  // Enviar notificação push
  private async sendPushNotification(notification: any): Promise<void> {
    try {
      // Aqui você integraria com um serviço de push notifications
      // como Firebase Cloud Messaging, OneSignal, etc.

      logger.info(
        `Push notification enviada para usuário ${notification.userId}`,
        {
          title: notification.title,
          message: notification.message,
        }
      );

      // Exemplo de integração com Firebase (comentado)
      /*
      const message = {
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          notificationId: notification.id
        },
        token: userFCMToken // Token do dispositivo do usuário
      };
      
      await admin.messaging().send(message);
      */
    } catch (error) {
      logger.error('Erro ao enviar push notification:', error);
    }
  }

  // Enviar notificação por SMS
  private async sendSMSNotification(notification: any): Promise<void> {
    try {
      // Aqui você integraria com um serviço de SMS
      // como Twilio, AWS SNS, etc.

      logger.info(`SMS enviado para usuário ${notification.userId}`, {
        title: notification.title,
      });

      // Exemplo de integração com Twilio (comentado)
      /*
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { phone: true }
      });

      if (user?.phone) {
        await twilioClient.messages.create({
          body: `${notification.title}: ${notification.message}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: user.phone
        });
      }
      */
    } catch (error) {
      logger.error('Erro ao enviar SMS:', error);
    }
  }

  // Buscar notificações do usuário
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<{ notifications: any[]; total: number; unread: number }> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, type } = options;

      const whereClause: any = {};
      if (type) {
        whereClause.type = type;
      }
      // Filtrar por status para simular 'unread'
      if (unreadOnly) {
        whereClause.status = 'pending';
      }

      const [notifications, total, unread] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            alert: {
              select: {
                userId: true,
              },
            },
          },
        }),
        prisma.notification.count({ where: whereClause }),
        prisma.notification.count({ where: { status: 'pending' } }),
      ]);

      // Filtrar notificações do usuário
      const userNotifications = notifications.filter(
        n => n.alert.userId === userId
      );

      return { notifications: userNotifications, total, unread };
    } catch (error) {
      logger.error('Erro ao buscar notificações:', error);
      throw new Error('Falha ao buscar notificações');
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Verificar se a notificação pertence ao usuário
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          alert: {
            userId: userId,
          },
        },
      });

      if (notification) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      logger.info(`Notificação ${notificationId} marcada como lida`);
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      throw new Error('Falha ao atualizar notificação');
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          alert: {
            userId: userId,
          },
          status: 'pending',
        },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      logger.info(
        `${result.count} notificações marcadas como lidas para usuário ${userId}`
      );
      return result.count;
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      throw new Error('Falha ao atualizar notificações');
    }
  }

  // Deletar notificação
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verificar se a notificação pertence ao usuário antes de deletar
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          alert: {
            userId: userId,
          },
        },
      });

      if (notification) {
        await prisma.notification.delete({
          where: { id: notificationId },
        });
      }

      logger.info(`Notificação ${notificationId} deletada`);
    } catch (error) {
      logger.error('Erro ao deletar notificação:', error);
      throw new Error('Falha ao deletar notificação');
    }
  }

  // Limpar notificações antigas
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: 'sent',
        },
      });

      logger.info(`${result.count} notificações antigas removidas`);
      return result.count;
    } catch (error) {
      logger.error('Erro ao limpar notificações antigas:', error);
      return 0;
    }
  }

  // Atualizar preferências de notificação do usuário
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: preferences,
      });

      logger.info(
        `Preferências de notificação atualizadas para usuário ${userId}`
      );
    } catch (error) {
      logger.error('Erro ao atualizar preferências de notificação:', error);
      throw new Error('Falha ao atualizar preferências');
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats(userId: string): Promise<any> {
    try {
      const [total, unread] = await Promise.all([
        prisma.notification.count({
          where: {
            alert: {
              userId: userId,
            },
          },
        }),
        prisma.notification.count({
          where: {
            alert: {
              userId: userId,
            },
            status: 'pending',
          },
        }),
      ]);

      return {
        total,
        unread,
        read: total - unread,
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de notificações:', error);
      throw new Error('Falha ao obter estatísticas');
    }
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
