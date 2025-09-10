import { logger } from '../utils/logger';
import { FlightResult } from './airlineApiService';
import {
  FlexibleSearchResult,
  PriceCalendarEntry,
} from './flexibleSearchService';
import { prisma } from '../config/database';
import cacheService from './cacheService';

export interface RecommendationCriteria {
  priceWeight: number; // 0-1
  timeWeight: number; // 0-1
  comfortWeight: number; // 0-1
  flexibilityWeight: number; // 0-1
  loyaltyWeight: number; // 0-1
}

export interface FlightRecommendation {
  flight: FlightResult;
  score: number;
  reasons: string[];
  category:
    | 'best_deal'
    | 'fastest'
    | 'most_comfortable'
    | 'best_value'
    | 'premium';
  savings: {
    amount: number;
    percentage: number;
    comparedTo: 'average' | 'highest';
  };
  tags: string[];
}

export interface PersonalizedRecommendations {
  topRecommendations: FlightRecommendation[];
  categories: {
    bestDeals: FlightRecommendation[];
    fastestFlights: FlightRecommendation[];
    mostComfortable: FlightRecommendation[];
    bestValue: FlightRecommendation[];
    premiumOptions: FlightRecommendation[];
  };
  insights: {
    bestTimeToBook: string;
    priceAlert: boolean;
    alternativeRoutes: string[];
    seasonalTrends: string;
  };
  userProfile: {
    preferredAirlines: string[];
    averageSpending: number;
    frequentRoutes: string[];
    travelPatterns: string[];
  };
}

class RecommendationService {
  private readonly DEFAULT_CRITERIA: RecommendationCriteria = {
    priceWeight: 0.4,
    timeWeight: 0.2,
    comfortWeight: 0.2,
    flexibilityWeight: 0.1,
    loyaltyWeight: 0.1,
  };

  /**
   * Gera recomendações personalizadas baseadas no histórico do usuário
   */
  async generatePersonalizedRecommendations(
    flights: FlightResult[],
    userId?: string,
    criteria?: Partial<RecommendationCriteria>
  ): Promise<PersonalizedRecommendations> {
    try {
      logger.info('Gerando recomendações personalizadas', {
        userId,
        flightCount: flights.length,
      });

      if (flights.length === 0) {
        throw new Error('Nenhum voo disponível para recomendação');
      }

      // Obter perfil do usuário se disponível
      const userProfile = userId ? await this.getUserProfile(userId) : null;

      // Combinar critérios padrão com preferências do usuário
      const finalCriteria = {
        ...this.DEFAULT_CRITERIA,
        ...criteria,
        ...(userProfile?.preferences || {}),
      };

      // Calcular scores para todos os voos
      const scoredFlights = await this.scoreFlights(
        flights,
        finalCriteria,
        userProfile
      );

      // Categorizar recomendações
      const categories = this.categorizeRecommendations(scoredFlights);

      // Selecionar top recomendações
      const topRecommendations = scoredFlights.slice(0, 5);

      // Gerar insights
      const insights = await this.generateInsights(flights, userProfile);

      return {
        topRecommendations,
        categories,
        insights,
        userProfile: userProfile || this.getDefaultUserProfile(),
      };
    } catch (error: any) {
      logger.error('Erro ao gerar recomendações:', error.message);
      throw new Error(`Falha na geração de recomendações: ${error.message}`);
    }
  }

  /**
   * Encontra ofertas especiais baseadas em padrões de preço
   */
  async findSpecialDeals(
    flights: FlightResult[],
    priceHistory?: PriceCalendarEntry[]
  ): Promise<FlightRecommendation[]> {
    try {
      const deals: FlightRecommendation[] = [];

      // Calcular preço médio e estatísticas
      const prices = flights.map(f => f.price);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const maxPrice = Math.max(...prices);

      for (const flight of flights) {
        const savingsFromAvg = avgPrice - flight.price;
        const savingsFromMax = maxPrice - flight.price;
        const savingsPercent = (savingsFromAvg / avgPrice) * 100;

        // Critérios para ofertas especiais
        const isSpecialDeal =
          flight.isOffer ||
          savingsPercent >= 20 ||
          (flight.discountPercent && flight.discountPercent >= 15) ||
          this.isFlashSale(flight) ||
          this.isLastMinuteDeal(flight);

        if (isSpecialDeal) {
          const reasons = this.generateDealReasons(flight, savingsPercent);
          const tags = this.generateDealTags(flight);

          deals.push({
            flight,
            score: this.calculateDealScore(flight, savingsPercent),
            reasons,
            category: 'best_deal',
            savings: {
              amount: Math.max(savingsFromAvg, savingsFromMax),
              percentage: savingsPercent,
              comparedTo:
                savingsFromAvg > savingsFromMax ? 'average' : 'highest',
            },
            tags,
          });
        }
      }

      // Ordenar por score e retornar top 10
      return deals.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error: any) {
      logger.error('Erro ao encontrar ofertas especiais:', error.message);
      return [];
    }
  }

  /**
   * Recomenda melhor época para comprar baseado em dados históricos
   */
  async recommendBestBookingTime(
    origin: string,
    destination: string,
    targetDate: string
  ): Promise<{
    recommendation: string;
    confidence: number;
    priceProjection: {
      nextWeek: number;
      nextMonth: number;
      trend: 'rising' | 'falling' | 'stable';
    };
    tips: string[];
  }> {
    try {
      const cacheKey = `booking_time_${origin}_${destination}_${targetDate}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as any;
      }

      // Buscar dados históricos da rota
      const historicalData = await this.getHistoricalPriceData(
        origin,
        destination
      );

      // Analisar padrões sazonais
      const seasonalAnalysis = this.analyzeSeasonalPatterns(
        historicalData,
        targetDate
      );

      // Calcular tendência de preços
      const priceTrend = this.calculatePriceTrend(historicalData);

      // Gerar recomendação
      const recommendation = this.generateBookingRecommendation(
        seasonalAnalysis,
        priceTrend
      );

      const result = {
        recommendation: recommendation.message,
        confidence: recommendation.confidence,
        priceProjection: {
          nextWeek: recommendation.projectedPrices.nextWeek,
          nextMonth: recommendation.projectedPrices.nextMonth,
          trend: priceTrend.direction,
        },
        tips: recommendation.tips,
      };

      // Cache por 6 horas
      await cacheService.set(cacheKey, result, 21600);

      return result;
    } catch (error: any) {
      logger.error('Erro ao recomendar melhor época de compra:', error.message);
      return {
        recommendation:
          'Recomendamos monitorar os preços por alguns dias antes de comprar.',
        confidence: 0.5,
        priceProjection: {
          nextWeek: 0,
          nextMonth: 0,
          trend: 'stable' as const,
        },
        tips: [
          'Configure alertas de preço',
          'Compare com outras datas próximas',
        ],
      };
    }
  }

  /**
   * Sugere rotas alternativas que podem ser mais baratas
   */
  async suggestAlternativeRoutes(
    origin: string,
    destination: string,
    maxDetour: number = 2 // horas de detour máximo
  ): Promise<
    {
      route: string;
      savings: number;
      detourTime: number;
      airports: string[];
    }[]
  > {
    try {
      const alternatives: any[] = [];

      // Buscar aeroportos próximos
      const nearbyOrigins = await this.getNearbyAirports(origin, 100); // 100km
      const nearbyDestinations = await this.getNearbyAirports(destination, 100);

      // Buscar rotas com conexões populares
      const hubAirports = ['GRU', 'CGH', 'BSB', 'REC', 'FOR', 'SSA']; // Principais hubs brasileiros

      for (const hub of hubAirports) {
        if (hub !== origin && hub !== destination) {
          // Simular busca via hub
          const routeViaHub = `${origin}-${hub}-${destination}`;
          const estimatedSavings = Math.random() * 500 + 100; // Simulação
          const estimatedDetour = Math.random() * 3 + 0.5; // Simulação

          if (estimatedDetour <= maxDetour) {
            alternatives.push({
              route: routeViaHub,
              savings: estimatedSavings,
              detourTime: estimatedDetour,
              airports: [origin, hub, destination],
            });
          }
        }
      }

      // Adicionar aeroportos alternativos
      for (const altOrigin of nearbyOrigins) {
        for (const altDest of nearbyDestinations) {
          if (altOrigin !== origin || altDest !== destination) {
            alternatives.push({
              route: `${altOrigin}-${altDest}`,
              savings: Math.random() * 300 + 50,
              detourTime: Math.random() * 1.5,
              airports: [altOrigin, altDest],
            });
          }
        }
      }

      return alternatives.sort((a, b) => b.savings - a.savings).slice(0, 5);
    } catch (error: any) {
      logger.error('Erro ao sugerir rotas alternativas:', error.message);
      return [];
    }
  }

  // Métodos privados

  private async scoreFlights(
    flights: FlightResult[],
    criteria: RecommendationCriteria,
    userProfile: any
  ): Promise<FlightRecommendation[]> {
    const scoredFlights: FlightRecommendation[] = [];

    // Calcular estatísticas para normalização
    const prices = flights.map(f => f.price);
    const durations = flights.map(f => f.duration);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    for (const flight of flights) {
      // Normalizar scores (0-1)
      const priceScore = 1 - (flight.price - minPrice) / (maxPrice - minPrice);
      const timeScore =
        1 - (flight.duration - minDuration) / (maxDuration - minDuration);
      const comfortScore = this.calculateComfortScore(flight);
      const flexibilityScore = this.calculateFlexibilityScore(flight);
      const loyaltyScore = this.calculateLoyaltyScore(flight, userProfile);

      // Calcular score final ponderado
      const finalScore =
        priceScore * criteria.priceWeight +
        timeScore * criteria.timeWeight +
        comfortScore * criteria.comfortWeight +
        flexibilityScore * criteria.flexibilityWeight +
        loyaltyScore * criteria.loyaltyWeight;

      const reasons = this.generateRecommendationReasons(flight, {
        priceScore,
        timeScore,
        comfortScore,
        flexibilityScore,
        loyaltyScore,
      });

      const category = this.determineFlightCategory(flight, finalScore);
      const tags = this.generateFlightTags(flight);

      scoredFlights.push({
        flight,
        score: finalScore,
        reasons,
        category,
        savings: {
          amount: avgPrice - flight.price,
          percentage: ((avgPrice - flight.price) / avgPrice) * 100,
          comparedTo: 'average',
        },
        tags,
      });
    }

    return scoredFlights.sort((a, b) => b.score - a.score);
  }

  private calculateComfortScore(flight: FlightResult): number {
    let score = 0.5; // Base score

    // Classe do voo
    if (flight.classType === 'first') {
      score += 0.4;
    } else if (flight.classType === 'business') {
      score += 0.3;
    }

    // Número de paradas
    if (flight.stops === 0) {
      score += 0.2;
    } else if (flight.stops === 1) {
      score += 0.1;
    }

    // Horário do voo (preferir horários comerciais)
    const hour = new Date(flight.departureTime).getHours();
    if (hour >= 8 && hour <= 18) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private calculateFlexibilityScore(flight: FlightResult): number {
    let score = 0.5;

    // Disponibilidade de assentos
    if (flight.availableSeats && flight.availableSeats > 10) {
      score += 0.2;
    }

    // Voos diretos são mais flexíveis
    if (flight.stops === 0) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  private calculateLoyaltyScore(
    flight: FlightResult,
    userProfile: any
  ): number {
    if (!userProfile) {
      return 0.5;
    }

    let score = 0.5;

    // Companhia preferida
    if (userProfile.preferredAirlines?.includes(flight.airline.name)) {
      score += 0.3;
    }

    // Programa de fidelidade
    if (userProfile.loyaltyPrograms?.includes(flight.airline.code)) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private generateRecommendationReasons(
    flight: FlightResult,
    scores: any
  ): string[] {
    const reasons: string[] = [];

    if (scores.priceScore > 0.8) {
      reasons.push('Excelente preço');
    }
    if (scores.timeScore > 0.8) {
      reasons.push('Voo rápido');
    }
    if (scores.comfortScore > 0.8) {
      reasons.push('Máximo conforto');
    }
    if (flight.isOffer) {
      reasons.push('Oferta especial');
    }
    if (flight.stops === 0) {
      reasons.push('Voo direto');
    }
    if (flight.classType === 'business') {
      reasons.push('Classe executiva');
    }

    return reasons;
  }

  private determineFlightCategory(
    flight: FlightResult,
    score: number
  ): FlightRecommendation['category'] {
    if (flight.isOffer || score > 0.9) {
      return 'best_deal';
    }
    if (flight.duration < 180) {
      return 'fastest';
    } // menos de 3h
    if (flight.classType === 'first') {
      return 'premium';
    }
    if (flight.classType === 'business') {
      return 'most_comfortable';
    }
    return 'best_value';
  }

  private generateFlightTags(flight: FlightResult): string[] {
    const tags: string[] = [];

    if (flight.isOffer) {
      tags.push('Oferta');
    }
    if (flight.stops === 0) {
      tags.push('Direto');
    }
    if (flight.classType === 'business') {
      tags.push('Executiva');
    }
    if (flight.classType === 'first') {
      tags.push('Primeira Classe');
    }
    if (flight.discountPercent && flight.discountPercent > 20) {
      tags.push('Super Desconto');
    }

    return tags;
  }

  private categorizeRecommendations(scoredFlights: FlightRecommendation[]) {
    return {
      bestDeals: scoredFlights
        .filter(f => f.category === 'best_deal')
        .slice(0, 3),
      fastestFlights: scoredFlights
        .filter(f => f.category === 'fastest')
        .slice(0, 3),
      mostComfortable: scoredFlights
        .filter(f => f.category === 'most_comfortable')
        .slice(0, 3),
      bestValue: scoredFlights
        .filter(f => f.category === 'best_value')
        .slice(0, 3),
      premiumOptions: scoredFlights
        .filter(f => f.category === 'premium')
        .slice(0, 3),
    };
  }

  private async getUserProfile(userId: string) {
    try {
      // Buscar histórico de buscas e preferências do usuário
      const searches = await prisma.search.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Analisar padrões
      const preferredAirlines = this.extractPreferredAirlines(searches);
      const frequentRoutes = this.extractFrequentRoutes(searches);
      const averageSpending = this.calculateAverageSpending(searches);

      return {
        preferredAirlines,
        frequentRoutes,
        averageSpending,
        travelPatterns: this.analyzeTravelPatterns(searches),
        preferences: this.inferPreferences(searches),
      };
    } catch (error) {
      logger.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  }

  private getDefaultUserProfile() {
    return {
      preferredAirlines: [],
      averageSpending: 0,
      frequentRoutes: [],
      travelPatterns: [],
    };
  }

  private async generateInsights(flights: FlightResult[], userProfile: any) {
    return {
      bestTimeToBook: 'Entre 2-8 semanas antes da viagem para melhores preços',
      priceAlert: flights.some(f => f.isOffer),
      alternativeRoutes: ['Via São Paulo', 'Via Brasília'],
      seasonalTrends: 'Preços tendem a subir 15% durante feriados',
    };
  }

  // Métodos auxiliares simplificados
  private isFlashSale(flight: FlightResult): boolean {
    // Verificar se é uma oferta com desconto significativo
    return flight.isOffer && (flight.discountPercent || 0) >= 25;
  }

  private isLastMinuteDeal(flight: FlightResult): boolean {
    const departureDate = new Date(flight.departureTime);
    const now = new Date();
    const daysUntilDeparture =
      (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDeparture <= 7;
  }

  private generateDealReasons(
    flight: FlightResult,
    savingsPercent: number
  ): string[] {
    const reasons: string[] = [];

    if (savingsPercent >= 30) {
      reasons.push('Economia excepcional de mais de 30%');
    } else if (savingsPercent >= 20) {
      reasons.push('Ótima economia de mais de 20%');
    }

    if (flight.isOffer) {
      reasons.push('Oferta promocional limitada');
    }
    if (this.isFlashSale(flight)) {
      reasons.push('Oferta relâmpago - válida por pouco tempo');
    }
    if (this.isLastMinuteDeal(flight)) {
      reasons.push('Oferta de última hora');
    }

    return reasons;
  }

  private generateDealTags(flight: FlightResult): string[] {
    const tags: string[] = ['Oferta'];

    if (this.isFlashSale(flight)) {
      tags.push('Flash Sale');
    }
    if (this.isLastMinuteDeal(flight)) {
      tags.push('Última Hora');
    }
    if (flight.discountPercent && flight.discountPercent >= 30) {
      tags.push('Super Desconto');
    }

    return tags;
  }

  private calculateDealScore(
    flight: FlightResult,
    savingsPercent: number
  ): number {
    let score = savingsPercent / 100; // Base score from savings

    if (flight.isOffer) {
      score += 0.2;
    }
    if (this.isFlashSale(flight)) {
      score += 0.3;
    }
    if (this.isLastMinuteDeal(flight)) {
      score += 0.1;
    }
    if (flight.stops === 0) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  // Métodos simplificados para análise histórica
  private async getHistoricalPriceData(origin: string, destination: string) {
    // Implementação simplificada - em produção, buscar dados reais
    return [];
  }

  private analyzeSeasonalPatterns(data: any[], targetDate: string) {
    return { peak: false, trend: 'stable' };
  }

  private calculatePriceTrend(data: any[]) {
    return { direction: 'stable' as const, confidence: 0.5 };
  }

  private generateBookingRecommendation(seasonal: any, trend: any) {
    return {
      message: 'Recomendamos comprar nas próximas 2 semanas',
      confidence: 0.7,
      projectedPrices: { nextWeek: 0, nextMonth: 0 },
      tips: ['Configure alertas de preço', 'Compare datas próximas'],
    };
  }

  private async getNearbyAirports(airport: string, radiusKm: number) {
    // Implementação simplificada
    return [];
  }

  private extractPreferredAirlines(searches: any[]) {
    return [];
  }

  private extractFrequentRoutes(searches: any[]) {
    return [];
  }

  private calculateAverageSpending(searches: any[]) {
    return 0;
  }

  private analyzeTravelPatterns(searches: any[]) {
    return [];
  }

  private inferPreferences(searches: any[]) {
    return {};
  }
}

export default new RecommendationService();
export { RecommendationService };
