import { Router } from 'express';
import { body, query } from 'express-validator';
import * as flightController from '../controllers/flightController';
import {
  compareFlightPrices,
  searchBusinessClassFlights,
  getFlightStats,
} from '../controllers/flightController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
  validateRequest,
  validatePagination,
  validateDateRange,
  validateAirportCodes,
  validatePassengers,
  validateFlightClass,
} from '../middleware/validation';
import {
  flightSearchRateLimit,
  generalRateLimit,
} from '../middleware/rateLimitMiddleware';
import { sanitizeFlightSearch } from '../middleware/sanitization';

const router = Router();

// Buscar voos
router.get(
  '/search',
  flightSearchRateLimit,
  sanitizeFlightSearch,
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
      .withMessage('Limite deve ser entre 1 e 100'),
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
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
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
      .withMessage('Classe deve ser: business, economy ou both'),
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
      .withMessage('Classe deve ser: business, economy ou both'),
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
      .withMessage('Limite deve ser entre 1 e 100'),
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
      .withMessage('Limite deve ser entre 1 e 100'),
  ],
  validateRequest,
  validatePagination,
  flightController.getAirlines
);

// Rota para comparar preços de voos
router.post(
  '/compare-prices',
  flightSearchRateLimit,
  sanitizeFlightSearch,
  [
    body('origin').notEmpty().withMessage('Origem é obrigatória'),
    body('destination').notEmpty().withMessage('Destino é obrigatório'),
    body('departureDate')
      .isISO8601()
      .withMessage('Data de partida deve ser válida'),
    body('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    body('flightClass')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe de voo inválida'),
  ],
  compareFlightPrices
);

// Rota para buscar voos de classe executiva
router.post(
  '/business-class',
  sanitizeFlightSearch,
  [
    body('origin').notEmpty().withMessage('Origem é obrigatória'),
    body('destination').notEmpty().withMessage('Destino é obrigatório'),
    body('departureDate')
      .isISO8601()
      .withMessage('Data de partida deve ser válida'),
    body('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
  ],
  searchBusinessClassFlights
);

// Estatísticas de voos
router.get('/stats', getFlightStats);

// Busca flexível de voos com ofertas
router.post(
  '/flexible-search',
  flightSearchRateLimit,
  sanitizeFlightSearch,
  [
    body('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('departureDate')
      .notEmpty()
      .withMessage('Data de partida é obrigatória')
      .isISO8601()
      .withMessage('Data de partida deve estar no formato ISO 8601'),
    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Data de retorno deve estar no formato ISO 8601'),
    body('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    body('classType')
      .optional()
      .isIn(['business', 'economy', 'first'])
      .withMessage('Classe deve ser: business, economy ou first'),
    body('flexibleDays')
      .optional()
      .isInt({ min: 0, max: 14 })
      .withMessage('Dias flexíveis deve ser entre 0 e 14'),
    body('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço máximo deve ser um valor positivo'),
    body('directFlightsOnly')
      .optional()
      .isBoolean()
      .withMessage('Voos diretos deve ser verdadeiro ou falso'),
  ],
  validateRequest,
  optionalAuth,
  flightController.searchFlexibleFlights
);

// Buscar ofertas especiais
router.get(
  '/special-offers',
  flightSearchRateLimit,
  [
    query('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
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
      .isIn(['business', 'economy', 'first'])
      .withMessage('Classe deve ser: business, economy ou first'),
  ],
  validateRequest,
  optionalAuth,
  flightController.getSpecialOffers
);

// Calendário de preços
router.get(
  '/price-calendar',
  generalRateLimit,
  [
    query('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('startDate')
      .notEmpty()
      .withMessage('Data inicial é obrigatória')
      .isISO8601()
      .withMessage('Data inicial deve estar no formato ISO 8601'),
    query('days')
      .optional()
      .isInt({ min: 1, max: 90 })
      .withMessage('Número de dias deve ser entre 1 e 90'),
  ],
  validateRequest,
  flightController.getPriceCalendar
);

// Melhor época para comprar
router.get(
  '/best-booking-time',
  generalRateLimit,
  [
    query('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('targetDate')
      .notEmpty()
      .withMessage('Data alvo é obrigatória')
      .isISO8601()
      .withMessage('Data alvo deve estar no formato ISO 8601'),
  ],
  validateRequest,
  flightController.getBestBookingTime
);

// Rotas alternativas
router.get(
  '/alternative-routes',
  generalRateLimit,
  [
    query('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    query('maxDetour')
      .optional()
      .isInt({ min: 1, max: 8 })
      .withMessage('Detour máximo deve ser entre 1 e 8 horas'),
  ],
  validateRequest,
  flightController.getAlternativeRoutes
);

// Monitorar preços
router.post(
  '/monitor-price',
  generalRateLimit,
  [
    body('origin')
      .notEmpty()
      .withMessage('Origem é obrigatória')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('destination')
      .notEmpty()
      .withMessage('Destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('targetPrice')
      .notEmpty()
      .withMessage('Preço alvo é obrigatório')
      .isFloat({ min: 0 })
      .withMessage('Preço alvo deve ser um valor positivo'),
    body('priceDropPercent')
      .optional()
      .isInt({ min: 5, max: 50 })
      .withMessage('Percentual de queda deve ser entre 5% e 50%'),
  ],
  validateRequest,
  authenticateToken,
  flightController.monitorRoutePrice
);

export default router;
