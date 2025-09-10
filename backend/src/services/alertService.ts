import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { flightService, FlightSearchParams } from './flightService';
import { emailService } from './emailService';
import { io } from '../server';

interface AlertTrigger {
  alertId: string;
  userId: string;
  flightData: any;
  triggerType: 'price_drop' | 'new_deal' | 'availability';
}

class AlertService {
  private isRunning = false;

  // Inicializar sistema de alertas
  initialize() {
    // Executar verificação de alertas a cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      if (!this.isRunning) {
        await this.checkAllAlerts();
      }
    });

    logger.info('Sistema de alertas inicializado');
  }

  // Verificar todos os alertas ativos
  async checkAllAlerts(): Promise<void> {
    if (this.isRunning) {
      logger.info('Verificação de alertas já em execução, pulando...');
      return;
    }

    this.isRunning = true;
    logger.info('Iniciando verificação de alertas...');

    try {
      const activeAlerts = await prisma.alert.findMany({
        where: {
          isActive: true,
          user: {
            isActive: true,
          },
        },
        include: {
          user: true,
        },
      });

      logger.info(`Verificando ${activeAlerts.length} alertas ativos`);

      const alertPromises = activeAlerts.map(alert =>
        this.checkSingleAlert(alert).catch(error => {
          logger.error(`Erro ao verificar alerta ${alert.id}:`, error);
        })
      );

      await Promise.allSettled(alertPromises);
      logger.info('Verificação de alertas concluída');
    } catch (error) {
      logger.error('Erro na verificação de alertas:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Verificar um alerta específico
  async checkSingleAlert(alert: any): Promise<void> {
    try {
      const searchParams: FlightSearchParams = {
        origin: alert.departureCode,
        destination: alert.arrivalCode,
        departureDate:
          alert.departureDate?.toISOString() ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        returnDate: alert.returnDate?.toISOString(),
        passengers: 1,
        classType: alert.classType as 'business' | 'economy' | 'both',
      };

      const searchResult = await flightService.searchAllFlights(searchParams);
      const relevantFlights = this.filterFlightsByAlert(
        searchResult.flights,
        alert
      );

      if (relevantFlights.length > 0) {
        const triggers = this.evaluateAlertTriggers(relevantFlights, alert);

        for (const trigger of triggers) {
          await this.triggerAlert(trigger);
        }

        // Atualizar último trigger
        await prisma.alert.update({
          where: { id: alert.id },
          data: { lastTriggered: new Date() },
        });
      }
    } catch (error) {
      logger.error(`Erro ao verificar alerta ${alert.id}:`, error);
    }
  }

  // Filtrar voos relevantes para o alerta
  private filterFlightsByAlert(flights: any[], alert: any): any[] {
    return flights.filter(flight => {
      // Filtrar por classe
      if (alert.classType !== 'both' && flight.classType !== alert.classType) {
        return false;
      }

      // Filtrar por preço máximo
      if (alert.maxPrice && flight.price > alert.maxPrice) {
        return false;
      }

      // Filtrar por preço mínimo (para detectar promoções)
      if (alert.minPrice && flight.price < alert.minPrice) {
        return true; // Promoção detectada!
      }

      // Filtrar por número máximo de paradas
      if (alert.maxStops !== null && flight.stops > alert.maxStops) {
        return false;
      }

      // Filtrar por companhias preferidas
      if (alert.preferredAirlines && alert.preferredAirlines.length > 0) {
        const airlineCode = this.getAirlineCode(flight.airline);
        if (!alert.preferredAirlines.includes(airlineCode)) {
          return false;
        }
      }

      return true;
    });
  }

  // Avaliar se o alerta deve ser disparado
  private evaluateAlertTriggers(flights: any[], alert: any): AlertTrigger[] {
    const triggers: AlertTrigger[] = [];
    const now = new Date();
    const lastTriggered = alert.lastTriggered;
    const minInterval = 60 * 60 * 1000; // 1 hora mínima entre alertas

    // Verificar se passou tempo suficiente desde o último alerta
    if (
      lastTriggered &&
      now.getTime() - lastTriggered.getTime() < minInterval
    ) {
      return triggers;
    }

    for (const flight of flights) {
      let triggerType: 'price_drop' | 'new_deal' | 'availability' = 'new_deal';

      // Detectar queda de preço
      if (alert.maxPrice && flight.price <= alert.maxPrice * 0.9) {
        triggerType = 'price_drop';
      }

      // Detectar promoção (preço muito baixo)
      if (alert.minPrice && flight.price <= alert.minPrice) {
        triggerType = 'new_deal';
      }

      // Detectar disponibilidade limitada
      if (flight.availableSeats <= 5) {
        triggerType = 'availability';
      }

      triggers.push({
        alertId: alert.id,
        userId: alert.userId,
        flightData: flight,
        triggerType,
      });
    }

    return triggers;
  }

  // Disparar alerta
  async triggerAlert(trigger: AlertTrigger): Promise<void> {
    try {
      const alert = await prisma.alert.findUnique({
        where: { id: trigger.alertId },
        include: { user: true },
      });

      if (!alert) {
        logger.error(`Alerta ${trigger.alertId} não encontrado`);
        return;
      }

      // Criar notificação no banco
      const notification = await prisma.notification.create({
        data: {
          alertId: trigger.alertId,
          title: this.generateNotificationTitle(trigger),
          message: this.generateNotificationMessage(trigger),
          type: 'system',
          status: 'pending',
        },
      });

      // Enviar notificação por email
      if (alert.emailNotification && alert.user.email) {
        await emailService.sendAlertEmail({
          to: alert.user.email,
          userName: alert.user.name,
          alertName: alert.name,
          flightData: trigger.flightData,
          triggerType: trigger.triggerType,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      // Enviar notificação push via WebSocket
      if (alert.pushNotification) {
        io.to(`user-${trigger.userId}`).emit('flight-alert', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          flightData: trigger.flightData,
          triggerType: trigger.triggerType,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(
        `Alerta disparado: ${trigger.alertId} para usuário ${trigger.userId}`
      );
    } catch (error) {
      logger.error('Erro ao disparar alerta:', error);
    }
  }

  // Gerar título da notificação
  private generateNotificationTitle(trigger: AlertTrigger): string {
    const flight = trigger.flightData;

    switch (trigger.triggerType) {
      case 'price_drop':
        return `💰 Preço Reduzido: ${flight.origin} → ${flight.destination}`;
      case 'new_deal':
        return `🔥 Promoção Encontrada: ${flight.origin} → ${flight.destination}`;
      case 'availability':
        return `⚡ Últimas Vagas: ${flight.origin} → ${flight.destination}`;
      default:
        return `✈️ Voo Encontrado: ${flight.origin} → ${flight.destination}`;
    }
  }

  // Gerar mensagem da notificação
  private generateNotificationMessage(trigger: AlertTrigger): string {
    const flight = trigger.flightData;
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: flight.currency,
    }).format(flight.price);

    const departureDate = new Date(flight.departureTime).toLocaleDateString(
      'pt-BR'
    );
    const departureTime = new Date(flight.departureTime).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    return (
      `${flight.airline} ${flight.flightNumber} - ${price} em classe executiva\n` +
      `Partida: ${departureDate} às ${departureTime}\n` +
      `Duração: ${Math.floor(flight.duration / 60)}h${flight.duration % 60}m\n` +
      `Paradas: ${flight.stops === 0 ? 'Direto' : `${flight.stops} parada(s)`}\n` +
      `Vagas disponíveis: ${flight.availableSeats}`
    );
  }

  // Obter código da companhia aérea
  private getAirlineCode(airlineName: string): string {
    const codes: { [key: string]: string } = {
      LATAM: 'LA',
      GOL: 'G3',
      Azul: 'AD',
      TAP: 'TP',
      'Air France': 'AF',
    };

    return codes[airlineName] || airlineName.substring(0, 2).toUpperCase();
  }

  // Criar novo alerta
  async createAlert(userId: string, alertData: any): Promise<any> {
    try {
      const alert = await prisma.alert.create({
        data: {
          userId,
          name: alertData.name,
          departureCode: alertData.departureCode,
          arrivalCode: alertData.arrivalCode,
          departureDate: alertData.departureDate
            ? new Date(alertData.departureDate)
            : null,
          returnDate: alertData.returnDate
            ? new Date(alertData.returnDate)
            : null,
          maxPrice: alertData.maxPrice,
          minPrice: alertData.minPrice,
          currency: alertData.currency || 'BRL',
          classType: alertData.classType || 'business',
          maxStops: alertData.maxStops,
          preferredAirlines: alertData.preferredAirlines || [],
          emailNotification: alertData.emailNotification !== false,
          pushNotification: alertData.pushNotification !== false,
        },
      });

      logger.info(`Novo alerta criado: ${alert.id} para usuário ${userId}`);
      return alert;
    } catch (error) {
      logger.error('Erro ao criar alerta:', error);
      throw error;
    }
  }

  // Atualizar alerta
  async updateAlert(
    alertId: string,
    userId: string,
    updateData: any
  ): Promise<any> {
    try {
      const alert = await prisma.alert.update({
        where: {
          id: alertId,
          userId, // Garantir que o usuário só pode atualizar seus próprios alertas
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      logger.info(`Alerta atualizado: ${alertId}`);
      return alert;
    } catch (error) {
      logger.error('Erro ao atualizar alerta:', error);
      throw error;
    }
  }

  // Deletar alerta
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    try {
      await prisma.alert.delete({
        where: {
          id: alertId,
          userId,
        },
      });

      logger.info(`Alerta deletado: ${alertId}`);
    } catch (error) {
      logger.error('Erro ao deletar alerta:', error);
      throw error;
    }
  }

  // Listar alertas do usuário
  async getUserAlerts(userId: string): Promise<any[]> {
    try {
      const alerts = await prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          notifications: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      return alerts;
    } catch (error) {
      logger.error('Erro ao listar alertas:', error);
      throw error;
    }
  }
}

export const alertService = new AlertService();
export default alertService;
