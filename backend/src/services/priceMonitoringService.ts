import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { AirlineApiAggregator } from './airlineApiService';
import { FlexibleSearchService } from './flexibleSearchService';
import emailService from '../utils/emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const airlineApi = new AirlineApiAggregator();
const flexibleSearch = new FlexibleSearchService();

export interface PriceAlert {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice?: number;
  priceDropPercent: number;
  isActive: boolean;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceMonitoringResult {
  alertId: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  shouldNotify: boolean;
  notificationSent: boolean;
}

export class PriceMonitoringService {
  private static instance: PriceMonitoringService;
  private isMonitoringActive = false;

  public static getInstance(): PriceMonitoringService {
    if (!PriceMonitoringService.instance) {
      PriceMonitoringService.instance = new PriceMonitoringService();
    }
    return PriceMonitoringService.instance;
  }

  /**
   * Inicia o monitoramento automático de preços
   */
  public startPriceMonitoring(): void {
    if (this.isMonitoringActive) {
      logger.info('Price monitoring is already active');
      return;
    }

    // Executa a cada 2 horas
    cron.schedule('0 */2 * * *', async () => {
      try {
        await this.checkAllPriceAlerts();
      } catch (error) {
        logger.error('Error in scheduled price monitoring:', error);
      }
    });

    // Executa a cada 30 minutos para ofertas especiais
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.checkSpecialOffers();
      } catch (error) {
        logger.error('Error in scheduled special offers check:', error);
      }
    });

    this.isMonitoringActive = true;
    logger.info('Price monitoring service started');
  }

  /**
   * Para o monitoramento automático
   */
  public stopPriceMonitoring(): void {
    this.isMonitoringActive = false;
    logger.info('Price monitoring service stopped');
  }

  /**
   * Cria um novo alerta de preço
   */
  public async createPriceAlert(
    userId: string,
    origin: string,
    destination: string,
    targetPrice: number,
    priceDropPercent: number = 10
  ): Promise<PriceAlert> {
    try {
      // Busca o preço atual
      const searchResult = await airlineApi.searchAllFlights({
        origin,
        destination,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 7 dias a partir de hoje
        classType: 'business',
        passengers: 1,
      });

      const currentPrice =
        searchResult.flights.length > 0
          ? Math.min(...searchResult.flights.map((f: any) => f.price))
          : undefined;

      const alert = await prisma.priceAlert.create({
        data: {
          userId,
          origin,
          destination,
          targetPrice,
          currentPrice,
          priceDropPercent,
          isActive: true,
          lastChecked: new Date(),
        },
      });

      logger.info(
        `Price alert created for user ${userId}: ${origin} -> ${destination}`
      );
      return alert as PriceAlert;
    } catch (error) {
      logger.error('Error creating price alert:', error);
      throw error;
    }
  }

  /**
   * Verifica todos os alertas de preço ativos
   */
  public async checkAllPriceAlerts(): Promise<PriceMonitoringResult[]> {
    try {
      const alerts = await prisma.priceAlert.findMany({
        where: { isActive: true },
        include: { user: true },
      });

      const results: PriceMonitoringResult[] = [];

      for (const alert of alerts) {
        try {
          const result = await this.checkSinglePriceAlert(alert.id);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          logger.error(`Error checking alert ${alert.id}:`, error);
        }
      }

      logger.info(
        `Checked ${alerts.length} price alerts, ${results.length} notifications sent`
      );
      return results;
    } catch (error) {
      logger.error('Error checking all price alerts:', error);
      throw error;
    }
  }

  /**
   * Verifica um alerta específico
   */
  public async checkSinglePriceAlert(
    alertId: string
  ): Promise<PriceMonitoringResult | null> {
    try {
      const alert = await prisma.priceAlert.findUnique({
        where: { id: alertId },
        include: { user: true },
      });

      if (!alert || !alert.isActive) {
        return null;
      }

      // Busca preços atuais
      const searchResult = await airlineApi.searchAllFlights({
        origin: alert.origin,
        destination: alert.destination,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        classType: 'business',
        passengers: 1,
      });

      if (searchResult.flights.length === 0) {
        return null;
      }

      const currentPrice = Math.min(
        ...searchResult.flights.map((f: any) => f.price)
      );
      const previousPrice = alert.currentPrice || alert.targetPrice;
      const priceChange = currentPrice - previousPrice;
      const priceChangePercent = (priceChange / previousPrice) * 100;

      // Verifica se deve notificar
      const shouldNotify =
        currentPrice <= alert.targetPrice ||
        priceChangePercent <= -alert.priceDropPercent;

      let notificationSent = false;

      if (shouldNotify) {
        try {
          await this.sendPriceAlert(
            alert,
            currentPrice,
            previousPrice,
            priceChangePercent
          );
          notificationSent = true;
        } catch (error) {
          logger.error(
            `Error sending notification for alert ${alertId}:`,
            error
          );
        }
      }

      // Atualiza o alerta
      await prisma.priceAlert.update({
        where: { id: alertId },
        data: {
          currentPrice,
          lastChecked: new Date(),
        },
      });

      return {
        alertId,
        previousPrice,
        currentPrice,
        priceChange,
        priceChangePercent,
        shouldNotify,
        notificationSent,
      };
    } catch (error) {
      logger.error(`Error checking single price alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica ofertas especiais e notifica usuários interessados
   */
  public async checkSpecialOffers(): Promise<void> {
    try {
      // Busca rotas populares
      const popularRoutes = await prisma.popularRoute.findMany({
        take: 20,
        orderBy: { searchCount: 'desc' },
      });

      for (const route of popularRoutes) {
        try {
          const offers = await flexibleSearch.searchSpecialOffers(
            route.origin,
            route.destination,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          );

          // Filtra ofertas realmente especiais (desconto > 30%)
          const specialOffers = offers.filter(
            offer => offer.discountPercent && offer.discountPercent > 30
          );

          if (specialOffers.length > 0) {
            await this.notifySpecialOffers(route, specialOffers);
          }
        } catch (error) {
          logger.error(
            `Error checking special offers for route ${route.origin}-${route.destination}:`,
            error
          );
        }
      }
    } catch (error) {
      logger.error('Error checking special offers:', error);
    }
  }

  /**
   * Envia notificação de alerta de preço
   */
  private async sendPriceAlert(
    alert: any,
    currentPrice: number,
    previousPrice: number,
    priceChangePercent: number
  ): Promise<void> {
    const subject = `🎯 Alerta de Preço - ${alert.origin} → ${alert.destination}`;

    const emailBody = `
      <h2>Seu alerta de preço foi ativado!</h2>
      <p><strong>Rota:</strong> ${alert.origin} → ${alert.destination}</p>
      <p><strong>Preço atual:</strong> R$ ${currentPrice.toFixed(2)}</p>
      <p><strong>Preço anterior:</strong> R$ ${previousPrice.toFixed(2)}</p>
      <p><strong>Variação:</strong> ${priceChangePercent.toFixed(1)}%</p>
      
      ${
        currentPrice <= alert.targetPrice
          ? `<p style="color: green;"><strong>✅ Preço atingiu seu alvo de R$ ${alert.targetPrice.toFixed(2)}!</strong></p>`
          : `<p style="color: orange;"><strong>📉 Queda de ${Math.abs(priceChangePercent).toFixed(1)}% no preço!</strong></p>`
      }
      
      <p>Acesse o FlightExec para ver as melhores ofertas disponíveis.</p>
    `;

    await emailService.sendEmail(alert.user.email, subject, emailBody);
    logger.info(`Price alert notification sent to ${alert.user.email}`);
  }

  /**
   * Notifica sobre ofertas especiais
   */
  private async notifySpecialOffers(route: any, offers: any[]): Promise<void> {
    // Busca usuários que já pesquisaram esta rota
    const interestedUsers = await prisma.search.findMany({
      where: {
        origin: route.origin,
        destination: route.destination,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
        },
      },
      include: { user: true },
      distinct: ['userId'],
    });

    const bestOffer = offers[0];
    const subject = `🔥 Oferta Especial - ${route.origin} → ${route.destination}`;

    const emailBody = `
      <h2>Oferta especial encontrada!</h2>
      <p><strong>Rota:</strong> ${route.origin} → ${route.destination}</p>
      <p><strong>Preço:</strong> R$ ${bestOffer.price.toFixed(2)}</p>
      <p><strong>Desconto:</strong> ${bestOffer.discountPercent}%</p>
      <p><strong>Companhia:</strong> ${bestOffer.airline}</p>
      
      <p style="color: red;"><strong>⏰ Oferta por tempo limitado!</strong></p>
      
      <p>Acesse o FlightExec agora para aproveitar esta oferta.</p>
    `;

    for (const userSearch of interestedUsers) {
      if (userSearch.user?.email) {
        try {
          await emailService.sendEmail(
            userSearch.user.email,
            subject,
            emailBody
          );
        } catch (error) {
          logger.error(
            `Error sending special offer notification to ${userSearch.user.email}:`,
            error
          );
        }
      }
    }

    logger.info(
      `Special offer notifications sent for route ${route.origin}-${route.destination}`
    );
  }

  /**
   * Desativa um alerta de preço
   */
  public async deactivatePriceAlert(alertId: string): Promise<void> {
    await prisma.priceAlert.update({
      where: { id: alertId },
      data: { isActive: false },
    });

    logger.info(`Price alert ${alertId} deactivated`);
  }

  /**
   * Lista alertas de um usuário
   */
  public async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return alerts as PriceAlert[];
  }

  /**
   * Obtém estatísticas de monitoramento
   */
  public async getMonitoringStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    alertsTriggeredToday: number;
    averagePriceDrop: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAlerts, activeAlerts, recentAlerts] = await Promise.all([
      prisma.priceAlert.count(),
      prisma.priceAlert.count({ where: { isActive: true } }),
      prisma.priceAlert.findMany({
        where: {
          lastChecked: { gte: today },
          currentPrice: { not: null },
        },
      }),
    ]);

    const alertsTriggeredToday = recentAlerts.filter(
      alert => alert.currentPrice && alert.currentPrice <= alert.targetPrice
    ).length;

    const priceDrops = recentAlerts
      .filter(
        (alert: any) =>
          alert.currentPrice && alert.currentPrice < alert.targetPrice
      )
      .map(
        (alert: any) =>
          ((alert.targetPrice - alert.currentPrice!) / alert.targetPrice) * 100
      );

    const averagePriceDrop =
      priceDrops.length > 0
        ? priceDrops.reduce((sum, drop) => sum + drop, 0) / priceDrops.length
        : 0;

    return {
      totalAlerts,
      activeAlerts,
      alertsTriggeredToday,
      averagePriceDrop,
    };
  }
}

export default PriceMonitoringService.getInstance();
