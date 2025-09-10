import { Router } from 'express';
import { body, query } from 'express-validator';
import * as flightController from '../controllers/flightController';
import { compareFlightPrices, searchBusinessClassFlights, getFlightStats } from '../controllers/flightController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
  validateRequest,
  validatePagination,
  validateDateRange,
  validateAirportCodes,
  validatePassengers,
  validateFlightClass
} from '../middleware/validation';
import {
  flightSearchRateLimit,
  generalRateLimit
} from '../middleware/rateLimitMiddleware';

const router = Router();

// Buscar voos
router.get(
  '/search',
  flightSearchRateLimit,
  [
    query('departureCode')
      .notEmpty()
      .withMessage('Código do aeroporto de origem é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('arrivalCode')
      .notEmpty()
      .withMessage('Código do aeroporto de destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('departureDate')
      .notEmpty()
      .withMessage('Data de partida é obrigatória')
      .isISO8601()
      .withMessage('Data de partida deve estar no formato ISO 8601'),
    query('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Data de retorno deve estar no formato ISO 8601'),
    query('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    query('classType')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe deve ser: business, economy ou both'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ],
  validateRequest,
  validateDateRange,
  validateAirportCodes,
  validatePassengers,
  validateFlightClass,
  validatePagination,
  optionalAuth,
  flightController.searchFlights
);

// Detalhes de um voo específico
router.get(
  '/:flightId',
  generalRateLimit,
  [
    query('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9')
  ],
  validateRequest,
  validatePassengers,
  optionalAuth,
  flightController.getFlightDetails
);

// Comparar preços de voos
router.get(
  '/compare/prices',
  flightSearchRateLimit,
  [
    query('departureCode')
      .notEmpty()
      .withMessage('Código do aeroporto de origem é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('arrivalCode')
      .notEmpty()
      .withMessage('Código do aeroporto de destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('departureDate')
      .notEmpty()
      .withMessage('Data de partida é obrigatória')
      .isISO8601()
      .withMessage('Data de partida deve estar no formato ISO 8601'),
    query('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    query('classType')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe deve ser: business, economy ou both')
  ],
  validateRequest,
  validateDateRange,
  validateAirportCodes,
  validatePassengers,
  validateFlightClass,
  optionalAuth,
  flightController.compareFlights
);

// Obter histórico de preços
router.get(
  '/history/prices',
  generalRateLimit,
  [
    query('departureCode')
      .notEmpty()
      .withMessage('Código do aeroporto de origem é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('arrivalCode')
      .notEmpty()
      .withMessage('Código do aeroporto de destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Número de dias deve ser entre 1 e 365'),
    query('classType')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe deve ser: business, economy ou both')
  ],
  validateRequest,
  validateAirportCodes,
  validateFlightClass,
  optionalAuth,
  flightController.getPriceHistory
);

// Listar aeroportos
router.get(
  '/airports',
  [
    query('search')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Termo de busca deve ter pelo menos 2 caracteres'),
    query('country')
      .optional()
      .isLength({ min: 2 })
      .withMessage('País deve ter pelo menos 2 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ],
  validateRequest,
  validatePagination,
  flightController.getAirports
);

// Listar companhias aéreas
router.get(
  '/airlines',
  [
    query('search')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Termo de busca deve ter pelo menos 2 caracteres'),
    query('country')
      .optional()
      .isLength({ min: 2 })
      .withMessage('País deve ter pelo menos 2 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número maior que 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ],
  validateRequest,
  validatePagination,
  flightController.getAirlines
);

// Rota para comparar preços de voos
router.post('/compare-prices',
  flightSearchRateLimit,
  [
    body('origin').notEmpty().withMessage('Origem é obrigatória'),
    body('destination').notEmpty().withMessage('Destino é obrigatório'),
    body('departureDate').isISO8601().withMessage('Data de partida deve ser válida'),
    body('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Número de passageiros deve ser entre 1 e 9'),
    body('flightClass').optional().isIn(['business', 'economy', 'both']).withMessage('Classe de voo inválida')
  ],
  compareFlightPrices
);

// Rota para buscar voos de classe executiva
router.post('/business-class',
  [
    body('origin').notEmpty().withMessage('Origem é obrigatória'),
    body('destination').notEmpty().withMessage('Destino é obrigatório'),
    body('departureDate').isISO8601().withMessage('Data de partida deve ser válida'),
    body('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Número de passageiros deve ser entre 1 e 9')
  ],
  searchBusinessClassFlights
);

// Rota para obter estatísticas de voos
router.get('/stats', getFlightStats);

export default router;