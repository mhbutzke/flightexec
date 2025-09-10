import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';
import cacheService from './cacheService';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  classType: 'business' | 'economy' | 'first';
  flexibleDays?: number;
}

export interface FlightResult {
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
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  classType: string;
  availableSeats: number;
  stops: number;
  aircraft?: string;
  bookingUrl: string;
  deepLinkUrl?: string;
  isOffer: boolean;
  discountPercent?: number;
  originalPrice?: number;
}

export interface ApiResponse {
  success: boolean;
  flights: FlightResult[];
  source: string;
  searchId?: string;
  error?: string;
}

abstract class BaseAirlineApi {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected baseUrl: string;
  protected rateLimitDelay: number = 1000; // 1 segundo entre requests
  protected lastRequestTime: number = 0;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlightExec-Radar/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Verificar se o client foi inicializado corretamente
    if (!this.client || !this.client.interceptors) {
      logger.warn('Axios client not properly initialized, skipping interceptors setup');
      return;
    }

    // Request interceptor para rate limiting
    this.client.interceptors.request.use(async config => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.rateLimitDelay) {
        const delay = this.rateLimitDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.lastRequestTime = Date.now();
      return config;
    });

    // Response interceptor para logging
    this.client.interceptors.response.use(
      response => {
        logger.info(
          `API ${this.constructor.name} - Success: ${response.status}`
        );
        return response;
      },
      error => {
        logger.error(`API ${this.constructor.name} - Error:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  protected async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error: any) {
      logger.error(
        `API Request failed for ${this.constructor.name}:`,
        error.message
      );
      throw new Error(`API Error: ${error.message}`);
    }
  }

  abstract searchFlights(params: FlightSearchParams): Promise<ApiResponse>;
  abstract getFlightDetails(flightId: string): Promise<FlightResult | null>;
}

// LATAM API Integration
class LatamApi extends BaseAirlineApi {
  constructor() {
    super(process.env.LATAM_API_KEY || 'test-key', 'https://api.latam.com/v1');
  }

  async searchFlights(params: FlightSearchParams): Promise<ApiResponse> {
    try {
      const cacheKey = `latam_search_${JSON.stringify(params)}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as ApiResponse;
      }

      const requestData = {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        cabinClass:
          params.classType === 'business' ? 'PREMIUM_BUSINESS' : 'ECONOMY',
        flexibleDays: params.flexibleDays || 0,
      };

      const response = await this.makeRequest<any>({
        method: 'POST',
        url: '/flights/search',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0',
        },
        data: requestData,
      });

      const flights = this.transformLatamResponse(response);
      const result: ApiResponse = {
        success: true,
        flights,
        source: 'LATAM',
        searchId: response.searchId,
      };

      // Cache por 5 minutos
      await cacheService.set(cacheKey, result, 300);
      return result;
    } catch (error: any) {
      logger.error('LATAM API Error:', error.message);
      return {
        success: false,
        flights: [],
        source: 'LATAM',
        error: error.message,
      };
    }
  }

  async getFlightDetails(flightId: string): Promise<FlightResult | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `/flights/${flightId}`,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return this.transformLatamFlight(response);
    } catch (error) {
      logger.error('LATAM Flight Details Error:', error);
      return null;
    }
  }

  private transformLatamResponse(response: any): FlightResult[] {
    if (!response.flights || !Array.isArray(response.flights)) {
      return [];
    }

    return response.flights.map((flight: any) =>
      this.transformLatamFlight(flight)
    );
  }

  private transformLatamFlight(flight: any): FlightResult {
    return {
      id: flight.id,
      airline: {
        code: 'LA',
        name: 'LATAM',
      },
      flightNumber: flight.flightNumber,
      origin: {
        code: flight.origin.code,
        name: flight.origin.name,
        city: flight.origin.city,
      },
      destination: {
        code: flight.destination.code,
        name: flight.destination.name,
        city: flight.destination.city,
      },
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      price: flight.price.amount,
      currency: flight.price.currency,
      classType:
        flight.cabinClass === 'PREMIUM_BUSINESS' ? 'business' : 'economy',
      availableSeats: flight.availableSeats,
      stops: flight.stops,
      aircraft: flight.aircraft,
      bookingUrl: `https://www.latam.com/booking/${flight.id}`,
      deepLinkUrl: flight.deepLink,
      isOffer: flight.isPromotion || false,
      discountPercent: flight.discount?.percentage,
      originalPrice: flight.originalPrice?.amount,
    };
  }
}

// GOL API Integration
class GolApi extends BaseAirlineApi {
  constructor() {
    super(process.env.GOL_API_KEY || 'test-key', 'https://api.voegol.com.br/v1');
  }

  async searchFlights(params: FlightSearchParams): Promise<ApiResponse> {
    try {
      const cacheKey = `gol_search_${JSON.stringify(params)}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as ApiResponse;
      }

      const requestData = {
        departureAirport: params.origin,
        arrivalAirport: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adultCount: params.passengers,
        cabinClass: params.classType === 'business' ? 'PREMIUM' : 'ECONOMY',
        flexibleSearch: params.flexibleDays ? true : false,
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/flights/search',
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
        },
        params: requestData,
      });

      const flights = this.transformGolResponse(response);
      const result: ApiResponse = {
        success: true,
        flights,
        source: 'GOL',
        searchId: response.sessionId,
      };

      await cacheService.set(cacheKey, result, 300);
      return result;
    } catch (error: any) {
      logger.error('GOL API Error:', error.message);
      return {
        success: false,
        flights: [],
        source: 'GOL',
        error: error.message,
      };
    }
  }

  async getFlightDetails(flightId: string): Promise<FlightResult | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `/flights/details/${flightId}`,
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      return this.transformGolFlight(response);
    } catch (error) {
      logger.error('GOL Flight Details Error:', error);
      return null;
    }
  }

  private transformGolResponse(response: any): FlightResult[] {
    if (!response.results || !Array.isArray(response.results)) {
      return [];
    }

    return response.results.map((flight: any) =>
      this.transformGolFlight(flight)
    );
  }

  private transformGolFlight(flight: any): FlightResult {
    return {
      id: flight.flightKey,
      airline: {
        code: 'G3',
        name: 'GOL',
      },
      flightNumber: flight.flightNumber,
      origin: {
        code: flight.departure.airport,
        name: flight.departure.airportName,
        city: flight.departure.city,
      },
      destination: {
        code: flight.arrival.airport,
        name: flight.arrival.airportName,
        city: flight.arrival.city,
      },
      departureTime: flight.departure.dateTime,
      arrivalTime: flight.arrival.dateTime,
      duration: flight.flightTime,
      price: flight.fare.totalAmount,
      currency: flight.fare.currency,
      classType: flight.cabinClass === 'PREMIUM' ? 'business' : 'economy',
      availableSeats: flight.availableSeats,
      stops: flight.stops,
      aircraft: flight.equipment,
      bookingUrl: `https://www.voegol.com.br/booking/${flight.flightKey}`,
      deepLinkUrl: flight.bookingUrl,
      isOffer: flight.isSpecialOffer || false,
      discountPercent: flight.discountPercentage,
      originalPrice: flight.originalPrice,
    };
  }
}

// Azul API Integration
class AzulApi extends BaseAirlineApi {
  constructor() {
    super(process.env.AZUL_API_KEY || 'test-key', 'https://api.voeazul.com.br/v1');
  }

  async searchFlights(params: FlightSearchParams): Promise<ApiResponse> {
    try {
      const cacheKey = `azul_search_${JSON.stringify(params)}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached as ApiResponse;
      }

      const requestData = {
        origin: params.origin,
        destination: params.destination,
        outboundDate: params.departureDate,
        inboundDate: params.returnDate,
        passengers: params.passengers,
        fareClass: params.classType === 'business' ? 'BUSINESS' : 'ECONOMY',
        flexibleDates: params.flexibleDays || 0,
      };

      const response = await this.makeRequest<any>({
        method: 'POST',
        url: '/flights/availability',
        headers: {
          Authorization: `ApiKey ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: requestData,
      });

      const flights = this.transformAzulResponse(response);
      const result: ApiResponse = {
        success: true,
        flights,
        source: 'AZUL',
        searchId: response.searchToken,
      };

      await cacheService.set(cacheKey, result, 300);
      return result;
    } catch (error: any) {
      logger.error('AZUL API Error:', error.message);
      return {
        success: false,
        flights: [],
        source: 'AZUL',
        error: error.message,
      };
    }
  }

  async getFlightDetails(flightId: string): Promise<FlightResult | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `/flights/${flightId}`,
        headers: {
          Authorization: `ApiKey ${this.apiKey}`,
        },
      });

      return this.transformAzulFlight(response);
    } catch (error) {
      logger.error('AZUL Flight Details Error:', error);
      return null;
    }
  }

  private transformAzulResponse(response: any): FlightResult[] {
    if (!response.flights || !Array.isArray(response.flights)) {
      return [];
    }

    return response.flights.map((flight: any) =>
      this.transformAzulFlight(flight)
    );
  }

  private transformAzulFlight(flight: any): FlightResult {
    return {
      id: flight.id,
      airline: {
        code: 'AD',
        name: 'Azul',
      },
      flightNumber: flight.flightNumber,
      origin: {
        code: flight.origin.code,
        name: flight.origin.name,
        city: flight.origin.city,
      },
      destination: {
        code: flight.destination.code,
        name: flight.destination.name,
        city: flight.destination.city,
      },
      departureTime: flight.departureDateTime,
      arrivalTime: flight.arrivalDateTime,
      duration: flight.duration,
      price: flight.price.total,
      currency: flight.price.currency,
      classType: flight.fareClass === 'BUSINESS' ? 'business' : 'economy',
      availableSeats: flight.seatsAvailable,
      stops: flight.connections,
      aircraft: flight.aircraftType,
      bookingUrl: `https://www.azul.com.br/booking/${flight.id}`,
      deepLinkUrl: flight.bookingLink,
      isOffer: flight.isPromotion || false,
      discountPercent: flight.promotionDiscount,
      originalPrice: flight.originalPrice,
    };
  }
}

// Agregador de APIs
class AirlineApiAggregator {
  private apis: BaseAirlineApi[];

  constructor() {
    this.apis = [new LatamApi(), new GolApi(), new AzulApi()];
  }

  async searchAllFlights(params: FlightSearchParams): Promise<{
    flights: FlightResult[];
    sources: string[];
    errors: string[];
  }> {
    const promises = this.apis.map(api =>
      api.searchFlights(params).catch(error => ({
        success: false,
        flights: [],
        source: api.constructor.name,
        error: error.message,
      }))
    );

    const results = await Promise.all(promises);

    const allFlights: FlightResult[] = [];
    const sources: string[] = [];
    const errors: string[] = [];

    results.forEach(result => {
      if (result.success) {
        allFlights.push(...result.flights);
        sources.push(result.source);
      } else {
        errors.push(`${result.source}: ${result.error}`);
      }
    });

    // Ordenar por preço (menor primeiro)
    allFlights.sort((a, b) => a.price - b.price);

    return {
      flights: allFlights,
      sources,
      errors,
    };
  }

  async getFlightDetails(
    flightId: string,
    source: string
  ): Promise<FlightResult | null> {
    const api = this.apis.find(api =>
      api.constructor.name.toLowerCase().includes(source.toLowerCase())
    );

    if (!api) {
      throw new Error(`API not found for source: ${source}`);
    }

    return api.getFlightDetails(flightId);
  }
}

export default new AirlineApiAggregator();
export { LatamApi, GolApi, AzulApi, AirlineApiAggregator };
