import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// Middleware para autenticar token JWT
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
      return;
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;

    // Verificar se usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
      return;
    }

    // Adicionar dados do usuário à requisição
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
      return;
    }

    logger.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware opcional para autenticação (não falha se não houver token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;

    // Verificar se usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continue sem autenticar
    logger.debug('Token opcional inválido:', error);
    next();
  }
};

// Middleware para verificar se usuário é admin (para futuras funcionalidades)
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    res.status(401).json({
      success: false,
      message: 'Autenticação requerida'
    });
    return;
  }

  // Por enquanto, todos os usuários são considerados admin
  // Em uma implementação futura, você pode adicionar um campo 'role' no modelo User
  next();
};

export default {
  authenticateToken,
  optionalAuth,
  requireAdmin
};