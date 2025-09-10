import axios from 'axios';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

// Interfaces para tipos de dados
interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  classType: 'business' | 'economy' | 'both';
}

interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  price: number;
  currency: string;
  classType: string;
  availableSeats: number;
  baggageIncluded: boolean;
  source: string;
}

interface APIResponse {
  flights: FlightResult[];
  totalResults: number;
  searchId: string;
}

class FlightService {
  private readonly CACHE_TTL = 600; // 10 minutos
  private readonly RATE_LIMIT_DELAY = 1000; // 1 segundo entre chamadas

  // Google Flights API Integration
  async searchGoogleFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const cacheKey = `google_flights_${JSON.stringify(params)}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Retornando resultados do cache - Google Flights');
        return JSON.parse(cached);
      }

      // Simulação da chamada para Google Flights API
      // Em produção, usar a API real do Google Flights
      const mockResults = this.generateMockFlights('Google Flights', params);
      
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(mockResults));
      logger.info(`Busca Google Flights realizada: ${params.origin} -> ${params.destination}`);
      
      return mockResults;
    } catch (error) {
      logger.error('Erro na busca Google Flights:', error);
      return [];
    }
  }

  // LATAM API Integration
  async searchLatamFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const cacheKey = `latam_flights_${JSON.stringify(params)}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Retornando resultados do cache - LATAM');
        return JSON.parse(cached);
      }

      // Simulação da chamada para LATAM API
      const mockResults = this.generateMockFlights('LATAM', params);
      
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(mockResults));
      logger.info(`Busca LATAM realizada: ${params.origin} -> ${params.destination}`);
      
      return mockResults;
    } catch (error) {
      logger.error('Erro na busca LATAM:', error);
      return [];
    }
  }

  // GOL API Integration
  async searchGolFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const cacheKey = `gol_flights_${JSON.stringify(params)}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Retornando resultados do cache - GOL');
        return JSON.parse(cached);
      }

      // Simulação da chamada para GOL API
      const mockResults = this.generateMockFlights('GOL', params);
      
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(mockResults));
      logger.info(`Busca GOL realizada: ${params.origin} -> ${params.destination}`);
      
      return mockResults;
    } catch (error) {
      logger.error('Erro na busca GOL:', error);
      return [];
    }
  }

  // Azul API Integration
  async searchAzulFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const cacheKey = `azul_flights_${JSON.stringify(params)}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Retornando resultados do cache - Azul');
        return JSON.parse(cached);
      }

      // Simulação da chamada para Azul API
      const mockResults = this.generateMockFlights('Azul', params);
      
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(mockResults));
      logger.info(`Busca Azul realizada: ${params.origin} -> ${params.destination}`);
      
      return mockResults;
    } catch (error) {
      logger.error('Erro na busca Azul:', error);
      return [];
    }
  }

  // Amadeus API Integration
  async searchAmadeusFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const cacheKey = `amadeus_flights_${JSON.stringify(params)}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.info('Retornando resultados do cache - Amadeus');
        return JSON.parse(cached);
      }

      const apiKey = process.env.AMADEUS_API_KEY;
      const apiSecret = process.env.AMADEUS_API_SECRET;
      
      if (!apiKey) {
        logger.warn('Chave da API Amadeus não configurada');
        return [];
      }

      // Implementação real da API Amadeus
      const amadeusResults = await this.callAmadeusAPI(params, apiKey, apiSecret);
      
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(amadeusResults));
      logger.info(`Busca Amadeus realizada: ${params.origin} -> ${params.destination}`);
      
      return amadeusResults;
    } catch (error) {
      logger.error('Erro na busca Amadeus:', error);
      // Retorna dados mock em caso de erro
      return this.generateMockFlights('Amadeus', params);
    }
  }

  // Chamada real para a API do Amadeus
  private async callAmadeusAPI(params: FlightSearchParams, apiKey: string, apiSecret?: string): Promise<FlightResult[]> {
    try {
      // Primeiro, obter token de acesso
      const tokenResponse = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
        'grant_type=client_credentials&client_id=' + apiKey + '&client_secret=' + (apiSecret || ''),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Buscar voos
      const flightResponse = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.passengers,
          travelClass: params.classType === 'business' ? 'BUSINESS' : 'ECONOMY',
          max: 20
        }
      });

      // Converter resposta da Amadeus para nosso formato
      return this.convertAmadeusResponse(flightResponse.data);
    } catch (error) {
      logger.error('Erro na chamada da API Amadeus:', error);
      // Retorna dados mock em caso de erro
      return this.generateMockFlights('Amadeus', params);
    }
  }

  // Converter resposta da Amadeus para nosso formato
  private convertAmadeusResponse(amadeusData: any): FlightResult[] {
    try {
      if (!amadeusData.data || !Array.isArray(amadeusData.data)) {
        return [];
      }

      return amadeusData.data.map((offer: any, index: number) => {
        const itinerary = offer.itineraries[0];
        const segment = itinerary.segments[0];
        const price = offer.price;

        return {
          id: `amadeus_${offer.id || index}`,
          airline: segment.carrierCode || 'Unknown',
          flightNumber: `${segment.carrierCode}${segment.number}`,
          origin: segment.departure.iataCode,
          destination: segment.arrival.iataCode,
          departureTime: segment.departure.at,
          arrivalTime: segment.arrival.at,
          duration: this.parseDuration(itinerary.duration),
          stops: itinerary.segments.length - 1,
          price: parseFloat(price.total),
          currency: price.currency,
          classType: segment.cabin || 'economy',
          availableSeats: offer.numberOfBookableSeats || 9,
          baggageIncluded: true,
          source: 'Amadeus'
        };
      });
    } catch (error) {
      logger.error('Erro ao converter resposta Amadeus:', error);
      return [];
    }
  }

  // Converter duração ISO 8601 para minutos
  private parseDuration(duration: string): number {
    try {
      const match = duration.match(/PT(\d+H)?(\d+M)?/);
      if (!match) return 0;
      
      const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
      const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
      
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  }

  // Busca consolidada em todas as APIs
  async searchAllFlights(params: FlightSearchParams): Promise<APIResponse> {
    try {
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info(`Iniciando busca consolidada: ${searchId}`);
      
      // Executar buscas em paralelo com controle de rate limit
      const promises = [
        this.searchGoogleFlights(params),
        this.searchLatamFlights(params),
        this.searchGolFlights(params),
        this.searchAzulFlights(params),
        this.searchAmadeusFlights(params)
      ];

      const results = await Promise.allSettled(promises);
      
      // Consolidar resultados
      const allFlights: FlightResult[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allFlights.push(...result.value);
        } else {
          const sources = ['Google Flights', 'LATAM', 'GOL', 'Azul', 'Amadeus'];
          logger.error(`Erro na busca ${sources[index]}:`, result.reason);
        }
      });

      // Filtrar apenas classe executiva se especificado
      const filteredFlights = params.classType === 'business' 
        ? allFlights.filter(flight => flight.classType === 'business')
        : allFlights;

      // Ordenar por preço
      const sortedFlights = filteredFlights.sort((a, b) => a.price - b.price);

      logger.info(`Busca consolidada finalizada: ${sortedFlights.length} voos encontrados`);
      
      return {
        flights: sortedFlights,
        totalResults: sortedFlights.length,
        searchId
      };
    } catch (error) {
      logger.error('Erro na busca consolidada:', error);
      throw error;
    }
  }

  // Comparar preços e encontrar melhores ofertas
  async compareFlights(flights: FlightResult[]): Promise<{
    bestPrice: FlightResult | null;
    bestDuration: FlightResult | null;
    bestValue: FlightResult | null;
    priceRange: { min: number; max: number; average: number };
  }> {
    if (flights.length === 0) {
      return {
        bestPrice: null,
        bestDuration: null,
        bestValue: null,
        priceRange: { min: 0, max: 0, average: 0 }
      };
    }

    const businessFlights = flights.filter(f => f.classType === 'business');
    
    if (businessFlights.length === 0) {
      return {
        bestPrice: null,
        bestDuration: null,
        bestValue: null,
        priceRange: { min: 0, max: 0, average: 0 }
      };
    }

    const bestPrice = businessFlights.reduce((min, flight) => 
      flight.price < min.price ? flight : min
    );

    const bestDuration = businessFlights.reduce((min, flight) => 
      flight.duration < min.duration ? flight : min
    );

    // Melhor valor: combinação de preço e duração
    const bestValue = businessFlights.reduce((best, flight) => {
      const currentScore = flight.price / flight.duration;
      const bestScore = best.price / best.duration;
      return currentScore < bestScore ? flight : best;
    });

    const prices = businessFlights.map(f => f.price);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };

    return {
      bestPrice,
      bestDuration,
      bestValue,
      priceRange
    };
  }

  // Gerador de dados mock para demonstração
  private generateMockFlights(source: string, params: FlightSearchParams): FlightResult[] {
    const airlines = {
      'Google Flights': ['LA', 'G3', 'AD', 'TP', 'AF'],
      'LATAM': ['LA'],
      'GOL': ['G3'],
      'Azul': ['AD']
    };

    const airlineNames = {
      'LA': 'LATAM',
      'G3': 'GOL',
      'AD': 'Azul',
      'TP': 'TAP',
      'AF': 'Air France'
    };

    const sourceAirlines = airlines[source as keyof typeof airlines] || ['LA'];
    const flights: FlightResult[] = [];

    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      const airlineCode = sourceAirlines[Math.floor(Math.random() * sourceAirlines.length)];
      const airline = airlineNames[airlineCode as keyof typeof airlineNames];
      
      const basePrice = params.classType === 'business' ? 3000 : 800;
      const priceVariation = Math.random() * 2000;
      
      flights.push({
        id: `${source.toLowerCase()}_${airlineCode}_${i}_${Date.now()}`,
        airline,
        flightNumber: `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`,
        origin: params.origin,
        destination: params.destination,
        departureTime: new Date(params.departureDate).toISOString(),
        arrivalTime: new Date(new Date(params.departureDate).getTime() + (Math.random() * 8 + 2) * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 480) + 120, // 2-10 horas
        stops: Math.floor(Math.random() * 3), // 0-2 paradas
        price: Math.floor(basePrice + priceVariation),
        currency: 'BRL',
        classType: params.classType === 'both' ? (Math.random() > 0.5 ? 'business' : 'economy') : params.classType,
        availableSeats: Math.floor(Math.random() * 20) + 1,
        baggageIncluded: Math.random() > 0.3,
        source: source.toLowerCase().replace(' ', '_')
      });
    }

    return flights;
  }
}

export const flightService = new FlightService();
export default flightService;
export type { FlightSearchParams, FlightResult, APIResponse };