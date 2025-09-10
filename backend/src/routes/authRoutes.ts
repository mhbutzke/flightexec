import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logout,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';
import {
  authRateLimit,
  generalRateLimit,
  authenticatedUserRateLimit,
} from '../middleware/rateLimitMiddleware';
import { sanitizeTextFields } from '../middleware/sanitization';

const router = Router();

// Validações
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ter um formato válido'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ter um formato válido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ter um formato válido'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Nova senha deve ter entre 6 e 128 caracteres'),
];

const requestPasswordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ter um formato válido'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token é obrigatório'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Nova senha deve ter entre 6 e 128 caracteres'),
];

// Rotas públicas
router.post(
  '/register',
  authRateLimit,
  sanitizeTextFields(['name', 'email', 'password']),
  registerValidation,
  validateRequest,
  register
);
router.post(
  '/login',
  authRateLimit,
  sanitizeTextFields(['email', 'password']),
  loginValidation,
  validateRequest,
  login
);
router.post(
  '/request-password-reset',
  authRateLimit,
  sanitizeTextFields(['email']),
  requestPasswordResetValidation,
  validateRequest,
  requestPasswordReset
);
router.post(
  '/reset-password',
  authRateLimit,
  sanitizeTextFields(['token', 'newPassword']),
  resetPasswordValidation,
  validateRequest,
  resetPassword
);

// Rotas protegidas
router.get('/profile', authenticateToken, generalRateLimit, getProfile);
router.put(
  '/profile',
  authenticateToken,
  authenticatedUserRateLimit,
  sanitizeTextFields(['name', 'email']),
  updateProfileValidation,
  validateRequest,
  updateProfile
);
router.put(
  '/change-password',
  authenticateToken,
  authRateLimit,
  sanitizeTextFields(['currentPassword', 'newPassword']),
  changePasswordValidation,
  validateRequest,
  changePassword
);
router.post('/logout', authenticateToken, generalRateLimit, logout);

export default router;
