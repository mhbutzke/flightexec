import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as alertController from '../controllers/alertController';
import { authenticateToken } from '../middleware/auth';
import {
  validateRequest,
  validatePagination,
  validateAirportCodes,
  validateFlightClass,
} from '../middleware/validation';
import {
  generalRateLimit,
  alertCreationRateLimit,
} from '../middleware/rateLimitMiddleware';
import { sanitizeTextFields } from '../middleware/sanitization';

const router = Router();

// Todas as rotas de alertas requerem autenticação
router.use(authenticateToken);

// Criar novo alerta
router.post(
  '/',
  alertCreationRateLimit,
  sanitizeTextFields(['name', 'notificationEmail']),
  [
    body('name')
      .notEmpty()
      .withMessage('Nome do alerta é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('departureCode')
      .notEmpty()
      .withMessage('Código do aeroporto de origem é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('arrivalCode')
      .notEmpty()
      .withMessage('Código do aeroporto de destino é obrigatório')
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('departureDate')
      .optional()
      .isISO8601()
      .withMessage('Data de partida deve estar no formato ISO 8601'),
    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Data de retorno deve estar no formato ISO 8601'),
    body('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço máximo deve ser um número positivo'),
    body('classType')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe deve ser: business, economy ou both'),
    body('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Status ativo deve ser verdadeiro ou falso'),
    body('notificationEmail')
      .optional()
      .isEmail()
      .withMessage('Email de notificação deve ser válido'),
    body('notificationWhatsapp')
      .optional()
      .isMobilePhone('pt-BR')
      .withMessage('WhatsApp deve ser um número válido'),
  ],
  validateRequest,
  validateAirportCodes,
  validateFlightClass,
  alertController.createAlert
);

// Listar alertas do usuário
router.get(
  '/',
  generalRateLimit,
  [
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'triggered', 'all'])
      .withMessage('Status deve ser: active, inactive, triggered ou all'),
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
  alertController.getUserAlerts
);

// Obter detalhes de um alerta específico
router.get(
  '/:alertId',
  [
    param('alertId')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido'),
  ],
  validateRequest,
  alertController.getAlert
);

// Atualizar alerta
router.put(
  '/:alertId',
  alertCreationRateLimit,
  sanitizeTextFields(['name', 'notificationEmail']),
  [
    param('alertId')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido'),
    body('name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('departureCode')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('arrivalCode')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Código do aeroporto deve ter 3 caracteres')
      .isAlpha()
      .withMessage('Código do aeroporto deve conter apenas letras'),
    body('departureDate')
      .optional()
      .isISO8601()
      .withMessage('Data de partida deve estar no formato ISO 8601'),
    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Data de retorno deve estar no formato ISO 8601'),
    body('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço máximo deve ser um número positivo'),
    body('classType')
      .optional()
      .isIn(['business', 'economy', 'both'])
      .withMessage('Classe deve ser: business, economy ou both'),
    body('passengers')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Número de passageiros deve ser entre 1 e 9'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('Status ativo deve ser verdadeiro ou falso'),
    body('notificationEmail')
      .optional()
      .isEmail()
      .withMessage('Email de notificação deve ser válido'),
    body('notificationWhatsapp')
      .optional()
      .isMobilePhone('pt-BR')
      .withMessage('WhatsApp deve ser um número válido'),
  ],
  validateRequest,
  validateAirportCodes,
  validateFlightClass,
  alertController.updateAlert
);

// Deletar alerta
router.delete(
  '/:alertId',
  [
    param('alertId')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido'),
  ],
  validateRequest,
  alertController.deleteAlert
);

// Testar alerta (verificar se há voos que atendem aos critérios)
router.post(
  '/:alertId/test',
  [
    param('alertId')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido'),
  ],
  validateRequest,
  alertController.testAlert
);

// Ativar/desativar alerta
router.patch(
  '/:alertId/toggle',
  [
    param('alertId')
      .isUUID()
      .withMessage('ID do alerta deve ser um UUID válido'),
  ],
  validateRequest,
  alertController.updateAlert
);

// Obter estatísticas dos alertas do usuário
router.get('/stats/summary', alertController.getAlertStats);

export default router;
