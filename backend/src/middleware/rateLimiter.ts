import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

// Rate limiter para requisições gerais
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 100, // Número de requisições
  duration: 60, // Por segundo
  blockDuration: 60, // Bloquear por 60 segundos se exceder
});

// Rate limiter mais restritivo para APIs de busca
const searchRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'search',
  points: 10, // Número de buscas
  duration: 60, // Por minuto
  blockDuration: 300, // Bloquear por 5 minutos se exceder
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Muitas requisições. Tente novamente em alguns segundos.',
      retryAfter: secs,
    });
  }
};

export const searchRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    await searchRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Limite de buscas excedido. Tente novamente em alguns minutos.',
      retryAfter: secs,
    });
  }
};

export { rateLimiterMiddleware as rateLimiter };
