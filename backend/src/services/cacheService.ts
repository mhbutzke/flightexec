import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import { FlightSearchParams, FlightSearchResult } from './flightSearchService';

interface CacheConfig {
  stdTTL: number; // Time to live em segundos
  checkperiod: number; // Período de verificação para limpeza automática
  useClones: boolean;
}

class CacheService {
  private cache: NodeCache;
  private flightCache: NodeCache;
  private priceHistoryCache: NodeCache;
  private rateLimitCache: NodeCache;

  constructor() {
    // Cache principal com TTL de 5 minutos
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutos
      checkperiod: 60, // Verifica a cada minuto
      useClones: false
    });

    // Cache específico para voos com TTL de 15 minutos
    this.flightCache = new NodeCache({
      stdTTL: 900, // 15 minutos
      checkperiod: 120, // Verifica a cada 2 minutos
      useClones: false
    });

    // Cache para histórico de preços com TTL de 1 hora
    this.priceHistoryCache = new NodeCache({
      stdTTL: 3600, // 1 hora
      checkperiod: 300, // Verifica a cada 5 minutos
      useClones: false
    });

    // Cache para rate limiting com TTL de 1 hora
    this.rateLimitCache = new NodeCache({
      stdTTL: 3600, // 1 hora
      checkperiod: 300,
      useClones: false
    });

    // Eventos de cache
    this.setupCacheEvents();
  }

  private setupCacheEvents(): void {
    this.cache.on('expired', (key: string, value: any) => {
      console.log(`Cache expired for key: ${key}`);
    });

    this.cache.on('del', (key: string, value: any) => {
      console.log(`Cache deleted for key: ${key}`);
    });

    this.flightCache.on('expired', (key: string, value: any) => {
      console.log(`Flight cache expired for key: ${key}`);
    });
  }

  // Gera uma chave única baseada nos parâmetros de busca
  private generateCacheKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = createHash('md5').update(paramString).digest('hex');
    return `${prefix}:${hash}`;
  }

  // Cache para resultados de busca de voos
  async cacheFlightSearch(
    params: FlightSearchParams, 
    results: FlightSearchResult[], 
    ttl?: number
  ): Promise<void> {
    const key = this.generateCacheKey('flight_search', params);
    const cacheData = {
      results,
      timestamp: new Date().toISOString(),
      params
    };
    
    if (ttl !== undefined) {
      this.flightCache.set(key, cacheData, ttl);
    } else {
      this.flightCache.set(key, cacheData);
    }
    console.log(`Cached flight search results for key: ${key}`);
  }

  async getCachedFlightSearch(params: FlightSearchParams): Promise<FlightSearchResult[] | null> {
    const key = this.generateCacheKey('flight_search', params);
    const cached = this.flightCache.get<{
      results: FlightSearchResult[];
      timestamp: string;
      params: FlightSearchParams;
    }>(key);

    if (cached) {
      console.log(`Cache hit for flight search: ${key}`);
      return cached.results;
    }

    console.log(`Cache miss for flight search: ${key}`);
    return null;
  }

  // Cache para histórico de preços
  async cachePriceHistory(
    origin: string, 
    destination: string, 
    flightClass: string, 
    data: any[], 
    ttl?: number
  ): Promise<void> {
    const key = this.generateCacheKey('price_history', { origin, destination, flightClass });
    const cacheData = {
      data,
      timestamp: new Date().toISOString()
    };
    
    if (ttl !== undefined) {
      this.priceHistoryCache.set(key, cacheData, ttl);
    } else {
      this.priceHistoryCache.set(key, cacheData);
    }
    console.log(`Cached price history for key: ${key}`);
  }

  async getCachedPriceHistory(
    origin: string, 
    destination: string, 
    flightClass: string
  ): Promise<any[] | null> {
    const key = this.generateCacheKey('price_history', { origin, destination, flightClass });
    const cached = this.priceHistoryCache.get<{
      data: any[];
      timestamp: string;
    }>(key);

    if (cached) {
      console.log(`Cache hit for price history: ${key}`);
      return cached.data;
    }

    console.log(`Cache miss for price history: ${key}`);
    return null;
  }

  // Cache genérico
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    return value || null;
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
    this.flightCache.flushAll();
    this.priceHistoryCache.flushAll();
    this.rateLimitCache.flushAll();
    console.log('All caches flushed');
  }

  // Rate Limiting
  async checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 3600000): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let requests = this.rateLimitCache.get<{
      count: number;
      firstRequest: number;
      lastRequest: number;
    }>(key);

    if (!requests || requests.firstRequest < windowStart) {
      // Nova janela de tempo ou primeira requisição
      requests = {
        count: 1,
        firstRequest: now,
        lastRequest: now
      };
    } else {
      // Incrementa contador na janela atual
      requests.count++;
      requests.lastRequest = now;
    }

    // Salva no cache com TTL baseado na janela de tempo
    const ttlSeconds = Math.ceil(windowMs / 1000);
    this.rateLimitCache.set(key, requests, ttlSeconds);

    const allowed = requests.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - requests.count);
    const resetTime = requests.firstRequest + windowMs;

    return {
      allowed,
      remaining,
      resetTime
    };
  }

  // Estatísticas do cache
  getStats(): {
    cache: NodeCache.Stats;
    flightCache: NodeCache.Stats;
    priceHistoryCache: NodeCache.Stats;
    rateLimitCache: NodeCache.Stats;
  } {
    return {
      cache: this.cache.getStats(),
      flightCache: this.flightCache.getStats(),
      priceHistoryCache: this.priceHistoryCache.getStats(),
      rateLimitCache: this.rateLimitCache.getStats()
    };
  }

  // Limpa caches expirados manualmente
  cleanupExpired(): void {
    this.cache.flushStats();
    this.flightCache.flushStats();
    this.priceHistoryCache.flushStats();
    this.rateLimitCache.flushStats();
  }
}

export default new CacheService();