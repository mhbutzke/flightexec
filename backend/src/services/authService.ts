import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
}

interface LoginResponse {
  user: UserResponse;
  token: string;
}

class AuthService {
  async register(data: RegisterData): Promise<UserResponse> {
    const { name, email, password } = data;

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validar força da senha
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    logger.info(`Novo usuário registrado: ${user.email}`);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async login(data: LoginData): Promise<LoginResponse> {
    const { email, password } = data;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    logger.info(`Login realizado: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
      token,
    };
  }

  async validateToken(token: string): Promise<UserResponse> {
    try {
      // Verificar token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as any;

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('Token inválido');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  async refreshToken(token: string): Promise<string> {
    const user = await this.validateToken(token);

    // Gerar novo token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return newToken;
  }
}

export const authService = new AuthService();
export default authService;
