import { PrismaClient } from '@prisma/client';
import cacheService from './cacheService';

const prisma = new PrismaClient();

export type FlightClass = 'business' | 'economy' | 'both';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  flightClass: FlightClass;
  maxPrice?: number;
  preferredAirlines?: string[];
  directFlightsOnly?: boolean;
}

export interface FlightSearchResult {
  id: string;
  airline: {
    code: string;
    name: string;
  };
  flightNumber: string;
  origin: {
    code: string;
    name: string;
    city: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
  };
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // em minutos
  price: number;
  currency: string;
  flightClass: FlightClass;
  availableSeats: number;
  stops: number;
  aircraft?: string;
  isActive: boolean;
}

export interface PriceComparison {
  flights: FlightSearchResult[];
  priceStats: {
    lowest: number;
    highest: number;
    average: number;
    median: number;
  };
  recommendations: {
    bestPrice: FlightSearchResult;
    bestValue: FlightSearchResult; // melhor custo-benefício
    fastest: FlightSearchResult;
    mostComfortable: FlightSearchResult;
  };
}

class FlightSearchService {
  /**
   * Busca voos com base nos parâmetros fornecidos
   */
  async searchFlights(
    params: FlightSearchParams
  ): Promise<FlightSearchResult[]> {
    // Verificar cache primeiro
    const cachedResults = await cacheService.getCachedFlightSearch(params);
    if (cachedResults) {
      console.log('Returning cached flight search results');
      return cachedResults;
    }

    const {
      origin,
      destination,
      departureDate,
      passengers,
      flightClass,
      maxPrice,
      preferredAirlines,
      directFlightsOnly,
    } = params;

    // Construir filtros dinâmicos
    const whereClause: any = {
      departureAirport: {
        code: origin,
      },
      arrivalAirport: {
        code: destination,
      },
      departureTime: {
        gte: new Date(
          departureDate.getFullYear(),
          departureDate.getMonth(),
          departureDate.getDate()
        ),
        lt: new Date(
          departureDate.getFullYear(),
          departureDate.getMonth(),
          departureDate.getDate() + 1
        ),
      },
      availableSeats: {
        gte: passengers,
      },
      isActive: true,
    };

    // Filtro por preço máximo
    if (maxPrice) {
      whereClause.price = {
        lte: maxPrice,
      };
    }

    // Filtro por companhias aéreas preferidas
    if (preferredAirlines && preferredAirlines.length > 0) {
      whereClause.airline = {
        code: {
          in: preferredAirlines,
        },
      };
    }

    // Filtro por voos diretos
    if (directFlightsOnly) {
      whereClause.stops = 0;
    }

    const flights = await prisma.flight.findMany({
      where: whereClause,
      include: {
        airline: true,
        departureAirport: true,
        arrivalAirport: true,
      },
      orderBy: [{ businessPrice: 'asc' }, { departureTime: 'asc' }],
    });

    const results = flights.map(flight => ({
      id: flight.id,
      airline: {
        code: flight.airline.code,
        name: flight.airline.name,
      },
      flightNumber: flight.flightNumber,
      origin: {
        code: flight.departureAirport.code,
        name: flight.departureAirport.name,
        city: flight.departureAirport.city,
      },
      destination: {
        code: flight.arrivalAirport.code,
        name: flight.arrivalAirport.name,
        city: flight.arrivalAirport.city,
      },
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      price:
        params.flightClass === 'business'
          ? Number(flight.businessPrice || 0)
          : Number(flight.economyPrice || 0),
      currency: flight.currency,
      flightClass: params.flightClass,
      availableSeats: flight.availableSeats || 0,
      stops: flight.stops,
      aircraft: flight.aircraft || undefined,
      isActive: flight.isActive,
    }));

    // Cachear os resultados por 15 minutos
    await cacheService.cacheFlightSearch(params, results, 900);

    return results;
  }

  /**
   * Compara preços e fornece análise detalhada
   */
  async compareFlightPrices(
    params: FlightSearchParams
  ): Promise<PriceComparison> {
    const flights = await this.searchFlights(params);

    if (flights.length === 0) {
      throw new Error('Nenhum voo encontrado para os critérios especificados');
    }

    // Calcular estatísticas de preço
    const prices = flights.map(f => f.price).sort((a, b) => a - b);
    const priceStats = {
      lowest: prices[0],
      highest: prices[prices.length - 1],
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      median:
        prices.length % 2 === 0
          ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
          : prices[Math.floor(prices.length / 2)],
    };

    // Encontrar recomendações
    const bestPrice = flights.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    const fastest = flights.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );

    // Melhor custo-benefício (considera preço, duração e número de paradas)
    const bestValue = flights.reduce((best, current) => {
      const currentScore = this.calculateValueScore(current);
      const bestScore = this.calculateValueScore(best);
      return currentScore > bestScore ? current : best;
    });

    // Mais confortável (classe executiva, menos paradas, melhor companhia)
    const mostComfortable = flights
      .filter(f => f.flightClass === 'business')
      .reduce((best, current) => {
        if (!best) {
          return current;
        }

        // Prioriza menos paradas
        if (current.stops < best.stops) {
          return current;
        }
        return best;
      }, flights[0]);

    return {
      flights,
      priceStats,
      recommendations: {
        bestPrice,
        bestValue,
        fastest,
        mostComfortable,
      },
    };
  }

  /**
   * Calcula score de custo-benefício
   */
  private calculateValueScore(flight: FlightSearchResult): number {
    // Score baseado em preço (invertido), duração (invertida) e paradas (invertidas)
    const priceScore = 1000 / flight.price; // Quanto menor o preço, maior o score
    const durationScore = 1000 / flight.duration; // Quanto menor a duração, maior o score
    const stopsScore = flight.stops === 0 ? 100 : flight.stops === 1 ? 50 : 25; // Penaliza paradas

    return priceScore + durationScore + stopsScore;
  }

  /**
   * Filtra voos por classe executiva com critérios específicos
   */
  async searchBusinessClassFlights(
    params: Omit<FlightSearchParams, 'flightClass'>
  ): Promise<FlightSearchResult[]> {
    return this.searchFlights({
      ...params,
      flightClass: 'business',
    });
  }

  /**
   * Busca histórico de preços para análise de tendências
   */
  async getPriceHistory(
    origin: string,
    destination: string,
    flightClass: FlightClass,
    days: number = 30
  ): Promise<any[]> {
    try {
      // Verificar cache primeiro
      const cachedHistory = await cacheService.getCachedPriceHistory(
        origin,
        destination,
        flightClass
      );
      if (cachedHistory) {
        console.log('Returning cached price history');
        return cachedHistory;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const priceHistory = await prisma.priceHistory.findMany({
        where: {
          flight: {
            departureAirport: { code: origin },
            arrivalAirport: { code: destination },
          },
          timestamp: {
            gte: startDate,
          },
        },
        include: {
          flight: {
            include: {
              airline: true,
            },
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      const results = priceHistory.map(record => ({
        date: record.timestamp,
        price:
          flightClass === 'business'
            ? Number(record.businessPrice || 0)
            : Number(record.economyPrice || 0),
        currency: record.currency,
        flightNumber: record.flight.flightNumber,
        airline: record.flight.airline.name,
      }));

      // Cachear por 1 hora
      await cacheService.cachePriceHistory(
        origin,
        destination,
        flightClass,
        results,
        3600
      );

      return results;
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  }

  /**
   * Salva busca do usuário para histórico
   */
  async saveUserSearch(
    userId: string,
    params: FlightSearchParams,
    results: FlightSearchResult[]
  ): Promise<void> {
    await prisma.search.create({
      data: {
        userId,
        departureCode: params.origin,
        arrivalCode: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        classType: params.flightClass,
        resultsCount: results.length,
      },
    });
  }
}

export default new FlightSearchService();
