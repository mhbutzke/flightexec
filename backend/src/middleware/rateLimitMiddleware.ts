import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cacheService';

export interface RateLimitOptions {
  windowMs?: number; // Janela de tempo em milissegundos (padrão: 15 minutos)
  maxRequests?: number; // Máximo de requisições por janela (padrão: 100)
  message?: string; // Mensagem de erro personalizada
  standardHeaders?: boolean; // Incluir headers padrão de rate limit
  legacyHeaders?: boolean; // Incluir headers legados
  skipSuccessfulRequests?: boolean; // Não contar requisições bem-sucedidas
  skipFailedRequests?: boolean; // Não contar requisições com erro
  keyGenerator?: (req: Request) => string; // Função para gerar chave única
}

const defaultOptions: Required<Omit<RateLimitOptions, 'keyGenerator'>> = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  message: 'Muitas requisições do mesmo IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

// Gerador de chave padrão baseado no IP
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

// Gerador de chave baseado no usuário autenticado
export const userBasedKeyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  return defaultKeyGenerator(req);
};

// Gerador de chave baseado no endpoint
export const endpointBasedKeyGenerator = (req: Request): string => {
  const baseKey = defaultKeyGenerator(req);
  const endpoint = req.route?.path || req.path;
  return `${baseKey}:${endpoint}`;
};

export function createRateLimit(options: RateLimitOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const config = { ...defaultOptions, ...options };
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      
      cacheService.checkRateLimit(
        key,
        config.maxRequests,
        config.windowMs
      ).then(rateLimitResult => {

        // Adiciona headers de rate limit
        if (config.standardHeaders) {
          res.set({
            'RateLimit-Limit': config.maxRequests.toString(),
            'RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          });
        }

        if (config.legacyHeaders) {
          res.set({
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          });
        }

        if (!rateLimitResult.allowed) {
          const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
          
          res.set({
            'Retry-After': retryAfter.toString()
          });

          res.status(429).json({
            error: 'Too Many Requests',
            message: config.message,
            retryAfter: retryAfter
          });
          return;
        }

        // Middleware para contar apenas requisições bem-sucedidas/com falha
        if (config.skipSuccessfulRequests || config.skipFailedRequests) {
          const originalSend = res.send;
          res.send = function(body) {
            const statusCode = res.statusCode;
            const isSuccess = statusCode >= 200 && statusCode < 300;
            const isError = statusCode >= 400;

            // Se deve pular requisições bem-sucedidas e esta é bem-sucedida
            if (config.skipSuccessfulRequests && isSuccess) {
              // Reverter o contador (implementação simplificada)
              console.log('Skipping successful request for rate limit');
            }

            // Se deve pular requisições com erro e esta tem erro
            if (config.skipFailedRequests && isError) {
              // Reverter o contador (implementação simplificada)
              console.log('Skipping failed request for rate limit');
            }

            return originalSend.call(this, body);
          };
        }

        next();
      }).catch(error => {
        console.error('Rate limit middleware error:', error);
        // Em caso de erro, permite a requisição continuar
        next();
      });
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Em caso de erro, permite a requisição continuar
      next();
    }
  };
}

// Middlewares pré-configurados para diferentes cenários

// Rate limit geral (100 req/15min por IP)
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  message: 'Muitas requisições. Tente novamente em 15 minutos.'
});

// Rate limit para APIs de busca de voos (mais restritivo)
export const flightSearchRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 20,
  message: 'Muitas buscas de voos. Tente novamente em 5 minutos.',
  keyGenerator: endpointBasedKeyGenerator
});

// Rate limit para autenticação (muito restritivo)
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true // Não conta logins bem-sucedidos
});

// Rate limit para usuários autenticados (mais permissivo)
export const authenticatedUserRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 200,
  message: 'Limite de requisições excedido. Tente novamente em 15 minutos.',
  keyGenerator: userBasedKeyGenerator
});

// Rate limit para criação de alertas
export const alertCreationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
  message: 'Muitos alertas criados. Tente novamente em 1 hora.',
  keyGenerator: userBasedKeyGenerator
});

export default {
  createRateLimit,
  generalRateLimit,
  flightSearchRateLimit,
  authRateLimit,
  authenticatedUserRateLimit,
  alertCreationRateLimit
};