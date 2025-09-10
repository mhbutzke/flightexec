import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
  validateRequest,
  validatePagination
} from '../middleware/validation';

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticateToken);

// Obter perfil do usuário
router.get(
  '/profile',
  authController.getProfile
);

// Atualizar perfil do usuário
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage('Nome deve conter apenas letras e espaços'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email deve ser válido')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone('pt-BR')
      .withMessage('Telefone deve ser um número válido'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferências devem ser um objeto'),
    body('preferences.currency')
      .optional()
      .isIn(['BRL', 'USD', 'EUR'])
      .withMessage('Moeda deve ser BRL, USD ou EUR'),
    body('preferences.language')
      .optional()
      .isIn(['pt-BR', 'en-US', 'es-ES'])
      .withMessage('Idioma deve ser pt-BR, en-US ou es-ES'),
    body('preferences.timezone')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Timezone deve ter entre 3 e 50 caracteres'),
    body('preferences.emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('Notificações por email devem ser verdadeiro ou falso'),
    body('preferences.pushNotifications')
      .optional()
      .isBoolean()
      .withMessage('Notificações push devem ser verdadeiro ou falso'),
    body('preferences.whatsappNotifications')
      .optional()
      .isBoolean()
      .withMessage('Notificações WhatsApp devem ser verdadeiro ou falso')
  ],
  validateRequest,
  authController.updateProfile
);

// Alterar senha
router.put(
  '/password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Nova senha deve ter pelo menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Confirmação de senha não confere');
        }
        return true;
      })
  ],
  validateRequest,
  authController.changePassword
);

// Desativar conta
router.delete(
  '/account',
  [
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória para desativar a conta'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Motivo deve ter no máximo 500 caracteres')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // Por enquanto, apenas desativa a conta (não deleta)
      // Em uma implementação futura, você pode adicionar lógica específica
      (res as Response).status(501).json({
        success: false,
        message: 'Funcionalidade de desativação de conta ainda não implementada'
      });
    } catch (error) {
      (res as Response).status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
);

// Obter estatísticas do usuário (buscas, alertas, etc.)
router.get(
  '/stats',
  async (req, res) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Buscar estatísticas básicas
      const [alertsCount, searchesCount, favoritesCount] = await Promise.all([
        // Contar alertas do usuário
        require('../config/database').prisma.alert.count({
          where: { userId }
        }),
        // Contar buscas do usuário
        require('../config/database').prisma.search.count({
          where: { userId }
        }),
        // Contar favoritos do usuário
        require('../config/database').prisma.favorite.count({
          where: { userId }
        })
      ]);

      res.json({
        success: true,
        data: {
          alerts: {
            total: alertsCount,
            active: 0, // TODO: implementar contagem de alertas ativos
            triggered: 0 // TODO: implementar contagem de alertas disparados
          },
          searches: {
            total: searchesCount,
            thisMonth: 0 // TODO: implementar contagem de buscas do mês
          },
          favorites: {
            total: favoritesCount
          },
          account: {
            memberSince: authReq.user?.createdAt || new Date(),
            lastLogin: new Date() // TODO: implementar tracking de último login
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
);

export default router;