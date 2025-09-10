import { addDays, format, parseISO } from 'date-fns';
import { logger } from '../utils/logger';
import airlineApiService, {
  FlightSearchParams,
  FlightResult,
} from './airlineApiService';
import cacheService from './cacheService';
import { prisma } from '../config/database';

export interface FlexibleSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  classType: 'business' | 'economy' | 'first';
  flexibleDays: number; // ±dias de flexibilidade
  maxPrice?: number;
  preferredAirlines?: string[];
  directFlightsOnly?: boolean;
}

export interface FlexibleSearchResult {
  bestOffers: FlightResult[];
  priceCalendar: PriceCalendarEntry[];
  recommendations: {
    cheapest: FlightResult;
    bestValue: FlightResult;
    fastest: FlightResult;
    mostFlexible: FlightResult;
  };
  priceStats: {
    lowest: number;
    highest: number;
    average: number;
    median: number;
    savingsPercent: number;
  };
  searchMetadata: {
    searchId: string;
    totalFlights: number;
    sourcesUsed: string[];
    searchTime: number;
    cacheHit: boolean;
  };
}

export interface PriceCalendarEntry {
  date: string;
  price: number;
  currency: string;
  flightCount: number;
  bestFlight: FlightResult;
  isOffer: boolean;
  discountPercent?: number;
}

class FlexibleSearchService {
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly MAX_CONCURRENT_SEARCHES = 5;

  /**
   * Busca voos com flexibilidade de datas
   */
  async searchFlexibleFlights(
    params: FlexibleSearchParams
  ): Promise<FlexibleSearchResult> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    logger.info(`Iniciando busca flexível: ${searchId}`, params);

    try {
      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(params);
      const cachedResult = await cacheService.get(cacheKey);

      if (cachedResult) {
        logger.info(`Cache hit para busca flexível: ${searchId}`);
        const result = cachedResult as FlexibleSearchResult;
        return {
          ...result,
          searchMetadata: {
            ...result.searchMetadata,
            cacheHit: true,
          },
        };
      }

      // Gerar datas para busca
      const searchDates = this.generateSearchDates(
        params.departureDate,
        params.flexibleDays
      );

      // Buscar voos para cada data
      const searchPromises = searchDates.map(date =>
        this.searchFlightsForDate({
          ...params,
          departureDate: date,
        })
      );

      // Executar buscas em lotes para evitar sobrecarga
      const allResults = await this.executeBatchSearches(searchPromises);

      // Processar e agregar resultados
      const result = await this.processFlexibleResults(
        allResults,
        searchDates,
        searchId,
        startTime
      );

      // Salvar no cache
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Salvar estatísticas da busca
      await this.saveSearchStats(params, result);

      logger.info(
        `Busca flexível concluída: ${searchId} - ${result.searchMetadata.totalFlights} voos encontrados`
      );

      return result;
    } catch (error: any) {
      logger.error(`Erro na busca flexível ${searchId}:`, error.message);
      throw new Error(`Falha na busca flexível: ${error.message}`);
    }
  }

  /**
   * Busca ofertas especiais em tempo real
   */
  async searchSpecialOffers(
    params: Omit<FlexibleSearchParams, 'flexibleDays'>
  ): Promise<FlightResult[]> {
    try {
      const cacheKey = `special_offers_${this.generateCacheKey(params)}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as FlightResult[];
      }

      // Buscar com flexibilidade de 7 dias
      const flexibleParams: FlexibleSearchParams = {
        ...params,
        flexibleDays: 7,
      };

      const result = await this.searchFlexibleFlights(flexibleParams);

      // Filtrar apenas ofertas especiais (desconto > 15%)
      const specialOffers = result.bestOffers.filter(
        flight => flight.isOffer && (flight.discountPercent || 0) >= 15
      );

      // Cache por 2 minutos (ofertas mudam rapidamente)
      await cacheService.set(cacheKey, specialOffers, 120);

      return specialOffers;
    } catch (error: any) {
      logger.error('Erro ao buscar ofertas especiais:', error.message);
      return [];
    }
  }

  /**
   * Gera calendário de preços para uma rota
   */
  async generatePriceCalendar(
    origin: string,
    destination: string,
    startDate: string,
    days: number = 30
  ): Promise<PriceCalendarEntry[]> {
    try {
      const cacheKey = `price_calendar_${origin}_${destination}_${startDate}_${days}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as PriceCalendarEntry[];
      }

      const calendar: PriceCalendarEntry[] = [];
      const searchPromises: Promise<any>[] = [];

      // Gerar buscas para cada dia
      for (let i = 0; i < days; i++) {
        const date = format(addDays(parseISO(startDate), i), 'yyyy-MM-dd');

        searchPromises.push(
          this.searchFlightsForDate({
            origin,
            destination,
            departureDate: date,
            passengers: 1,
            classType: 'business',
            flexibleDays: 0,
          }).then(flights => ({ date, flights }))
        );
      }

      // Executar buscas em lotes
      const results = await this.executeBatchSearches(searchPromises);

      // Processar resultados
      results.forEach(({ date, flights }) => {
        if (flights.length > 0) {
          const bestFlight = flights[0]; // Já ordenado por preço
          const avgPrice =
            flights.reduce((sum: number, f: FlightResult) => sum + f.price, 0) /
            flights.length;

          calendar.push({
            date,
            price: bestFlight.price,
            currency: bestFlight.currency,
            flightCount: flights.length,
            bestFlight,
            isOffer: bestFlight.isOffer,
            discountPercent: bestFlight.discountPercent,
          });
        }
      });

      // Cache por 1 hora
      await cacheService.set(cacheKey, calendar, 3600);

      return calendar;
    } catch (error: any) {
      logger.error('Erro ao gerar calendário de preços:', error.message);
      return [];
    }
  }

  /**
   * Monitora preços de uma rota específica
   */
  async monitorRoutePrice(
    origin: string,
    destination: string,
    targetPrice: number,
    priceDropPercent: number = 10
  ): Promise<boolean> {
    try {
      // Buscar preço atual
      const currentFlights = await this.searchFlightsForDate({
        origin,
        destination,
        departureDate: format(new Date(), 'yyyy-MM-dd'),
        passengers: 1,
        classType: 'business',
        flexibleDays: 0,
      });

      if (currentFlights.length === 0) {
        return false;
      }

      const currentPrice = currentFlights[0].price;
      const route = `${origin}-${destination}`;

      // Verificar se existe alerta para esta rota
      let priceAlert = await prisma.priceAlert.findFirst({
        where: { route },
      });

      if (!priceAlert) {
        // Criar novo alerta
        priceAlert = await prisma.priceAlert.create({
          data: {
            route,
            targetPrice,
            currentPrice,
            priceDropPercent,
          },
        });
      } else {
        // Atualizar alerta existente
        const previousPrice = Number(priceAlert.currentPrice) || currentPrice;
        const dropPercent =
          ((previousPrice - currentPrice) / previousPrice) * 100;

        await prisma.priceAlert.update({
          where: { id: priceAlert.id },
          data: {
            currentPrice,
            lastCheck: new Date(),
            isTriggered:
              dropPercent >= priceDropPercent || currentPrice <= targetPrice,
          },
        });

        // Retornar true se o alerta foi disparado
        return dropPercent >= priceDropPercent || currentPrice <= targetPrice;
      }

      return false;
    } catch (error: any) {
      logger.error('Erro ao monitorar preço da rota:', error.message);
      return false;
    }
  }

  // Métodos privados

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(params: any): string {
    return `flexible_search_${Buffer.from(JSON.stringify(params)).toString('base64')}`;
  }

  private generateSearchDates(
    baseDate: string,
    flexibleDays: number
  ): string[] {
    const dates: string[] = [];
    const base = parseISO(baseDate);

    for (let i = -flexibleDays; i <= flexibleDays; i++) {
      dates.push(format(addDays(base, i), 'yyyy-MM-dd'));
    }

    return dates;
  }

  private async searchFlightsForDate(
    params: FlightSearchParams
  ): Promise<FlightResult[]> {
    try {
      const result = await airlineApiService.searchAllFlights(params);
      return result.flights;
    } catch (error) {
      logger.error('Erro na busca para data específica:', error);
      return [];
    }
  }

  private async executeBatchSearches<T>(promises: Promise<T>[]): Promise<T[]> {
    const results: T[] = [];

    // Executar em lotes para evitar sobrecarga
    for (let i = 0; i < promises.length; i += this.MAX_CONCURRENT_SEARCHES) {
      const batch = promises.slice(i, i + this.MAX_CONCURRENT_SEARCHES);
      const batchResults = await Promise.allSettled(batch);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Pequena pausa entre lotes
      if (i + this.MAX_CONCURRENT_SEARCHES < promises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private async processFlexibleResults(
    allResults: FlightResult[][],
    searchDates: string[],
    searchId: string,
    startTime: number
  ): Promise<FlexibleSearchResult> {
    // Agregar todos os voos
    const allFlights = allResults.flat();

    if (allFlights.length === 0) {
      throw new Error('Nenhum voo encontrado para as datas especificadas');
    }

    // Ordenar por preço
    allFlights.sort((a, b) => a.price - b.price);

    // Selecionar melhores ofertas (top 20)
    const bestOffers = allFlights.slice(0, 20);

    // Gerar calendário de preços
    const priceCalendar: PriceCalendarEntry[] = searchDates
      .map((date, index) => {
        const dateFlights = allResults[index] || [];

        if (dateFlights.length === 0) {
          return null;
        }

        const bestFlight = dateFlights[0];
        return {
          date,
          price: bestFlight.price,
          currency: bestFlight.currency,
          flightCount: dateFlights.length,
          bestFlight,
          isOffer: bestFlight.isOffer,
          discountPercent: bestFlight.discountPercent,
        };
      })
      .filter(Boolean) as PriceCalendarEntry[];

    // Calcular estatísticas
    const prices = allFlights.map(f => f.price);
    const priceStats = {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      median: this.calculateMedian(prices),
      savingsPercent:
        ((Math.max(...prices) - Math.min(...prices)) / Math.max(...prices)) *
        100,
    };

    // Gerar recomendações
    const recommendations = {
      cheapest: allFlights[0],
      bestValue: this.findBestValue(allFlights),
      fastest: this.findFastest(allFlights),
      mostFlexible: this.findMostFlexible(allFlights),
    };

    return {
      bestOffers,
      priceCalendar,
      recommendations,
      priceStats,
      searchMetadata: {
        searchId,
        totalFlights: allFlights.length,
        sourcesUsed: [...new Set(allFlights.map(f => f.airline.name))],
        searchTime: Date.now() - startTime,
        cacheHit: false,
      },
    };
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  private findBestValue(flights: FlightResult[]): FlightResult {
    // Algoritmo simples: menor preço + menor duração + classe executiva
    return flights.reduce((best, current) => {
      const bestScore = this.calculateValueScore(best);
      const currentScore = this.calculateValueScore(current);

      return currentScore > bestScore ? current : best;
    });
  }

  private calculateValueScore(flight: FlightResult): number {
    const priceScore = 1000 / flight.price; // Menor preço = maior score
    const timeScore = 1000 / flight.duration; // Menor duração = maior score
    const classScore = flight.classType === 'business' ? 2 : 1;
    const offerScore = flight.isOffer ? 1.5 : 1;

    return priceScore * timeScore * classScore * offerScore;
  }

  private findFastest(flights: FlightResult[]): FlightResult {
    return flights.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );
  }

  private findMostFlexible(flights: FlightResult[]): FlightResult {
    // Voo com menos paradas e melhor horário
    return flights.reduce((best, current) => {
      if (current.stops < best.stops) {
        return current;
      }
      if (current.stops === best.stops) {
        // Preferir horários entre 8h e 18h
        const currentHour = new Date(current.departureTime).getHours();
        const bestHour = new Date(best.departureTime).getHours();

        const currentInRange = currentHour >= 8 && currentHour <= 18;
        const bestInRange = bestHour >= 8 && bestHour <= 18;

        if (currentInRange && !bestInRange) {
          return current;
        }
      }

      return best;
    });
  }

  private async saveSearchStats(
    params: FlexibleSearchParams,
    result: FlexibleSearchResult
  ): Promise<void> {
    try {
      // Atualizar estatísticas da rota
      const route = `${params.origin}-${params.destination}`;

      await prisma.popularRoute.upsert({
        where: {
          origin_destination: {
            origin: params.origin,
            destination: params.destination,
          },
        },
        update: {
          searchCount: { increment: 1 },
          avgPrice: result.priceStats.average,
          lastSearched: new Date(),
        },
        create: {
          origin: params.origin,
          destination: params.destination,
          searchCount: 1,
          avgPrice: result.priceStats.average,
          lastSearched: new Date(),
        },
      });
    } catch (error) {
      logger.error('Erro ao salvar estatísticas da busca:', error);
    }
  }
}

export default new FlexibleSearchService();
export { FlexibleSearchService };
