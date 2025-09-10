import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Registrar novo usuário
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
      });
      return;
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres',
      });
      return;
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Usuário já existe com este email',
      });
      return;
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail({
        to: user.email,
        userName: user.name,
      });
    } catch (emailError) {
      logger.warn('Erro ao enviar email de boas-vindas:', emailError);
    }

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Usuário registrado com sucesso',
    });

    logger.info(`Novo usuário registrado: ${user.email}`);
  } catch (error) {
    logger.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Login do usuário
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
      return;
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
      return;
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte',
      });
      return;
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
      return;
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      data: {
        user: userData,
        token,
      },
      message: 'Login realizado com sucesso',
    });

    logger.info(`Login realizado: ${user.email}`);
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Obter perfil do usuário autenticado
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    // Buscar dados completos do usuário
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            alerts: true,
            searches: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });

    logger.debug(`Perfil consultado: ${user.email}`);
  } catch (error) {
    logger.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Atualizar perfil do usuário
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const { name, email } = req.body;

    // Validação básica
    if (!name && !email) {
      res.status(400).json({
        success: false,
        message: 'Pelo menos um campo deve ser fornecido para atualização',
      });
      return;
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name) {
      if (name.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Nome deve ter pelo menos 2 caracteres',
        });
        return;
      }
      updateData.name = name.trim();
    }

    if (email) {
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Formato de email inválido',
        });
        return;
      }

      // Verificar se email já está em uso por outro usuário
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: authReq.user.id },
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Este email já está em uso por outro usuário',
        });
        return;
      }

      updateData.email = email.toLowerCase();
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso',
    });

    logger.info(`Perfil atualizado: ${updatedUser.email}`);
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Alterar senha
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validação básica
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias',
      });
      return;
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres',
      });
      return;
    }

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
      return;
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Senha atual incorreta',
      });
      return;
    }

    // Hash da nova senha
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await prisma.user.update({
      where: { id: authReq.user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });

    logger.info(`Senha alterada para usuário: ${user.email}`);
  } catch (error) {
    logger.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Solicitar redefinição de senha
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email é obrigatório',
      });
      return;
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Sempre retornar sucesso por segurança (não revelar se email existe)
    res.json({
      success: true,
      message:
        'Se o email existir em nossa base, você receberá instruções para redefinir sua senha',
    });

    // Se usuário existe, enviar email
    if (user && user.isActive) {
      // Gerar token temporário
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await emailService.sendPasswordResetEmail({
          to: user.email,
          userName: user.name,
          resetToken,
          resetUrl,
        });

        logger.info(
          `Email de redefinição de senha enviado para: ${user.email}`
        );
      } catch (emailError) {
        logger.error('Erro ao enviar email de redefinição:', emailError);
      }
    }
  } catch (error) {
    logger.error('Erro na solicitação de redefinição de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Redefinir senha com token
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios',
      });
      return;
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres',
      });
      return;
    }

    try {
      // Verificar token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;

      if (decoded.type !== 'password_reset') {
        res.status(401).json({
          success: false,
          message: 'Token inválido',
        });
        return;
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado ou inativo',
        });
        return;
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Senha redefinida com sucesso',
      });

      logger.info(`Senha redefinida para usuário: ${user.email}`);
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
      });
    }
  } catch (error) {
    logger.error('Erro na redefinição de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

// Logout (invalidar token - implementação básica)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Em uma implementação mais robusta, você manteria uma blacklist de tokens
    // Por enquanto, apenas retornamos sucesso
    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    logger.debug('Logout realizado');
  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logout,
};
