import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../setup';
import { authService } from '../../services/authService';

// Mock das dependências
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve criar um novo usuário com sucesso', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: 'user_123',
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Mock do Prisma create
      const prismaSpy = jest
        .spyOn(prisma.user, 'create')
        .mockResolvedValue(mockUser);
      const findUniqueSpy = jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(null);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(prismaSpy).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
      });
    });

    it('deve lançar erro se email já existir', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const existingUser = {
        id: 'existing_user',
        email: userData.email,
        name: 'Usuário Existente',
        password: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'Email já está em uso'
      );
    });

    it('deve validar formato do email', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'email_invalido',
        password: 'senha123',
      };

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'Formato de email inválido'
      );
    });

    it('deve validar força da senha', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123', // senha muito fraca
      };

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'Senha deve ter pelo menos 6 caracteres'
      );
    });
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Arrange
      const loginData = {
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user_123',
        name: 'João Silva',
        email: loginData.email,
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwt_token_123';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue(mockToken as never);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          isActive: mockUser.isActive,
        },
        token: mockToken,
      });
    });

    it('deve lançar erro para usuário não encontrado', async () => {
      // Arrange
      const loginData = {
        email: 'naoexiste@teste.com',
        password: 'senha123',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        'Credenciais inválidas'
      );
    });

    it('deve lançar erro para senha incorreta', async () => {
      // Arrange
      const loginData = {
        email: 'joao@teste.com',
        password: 'senha_errada',
      };

      const mockUser = {
        id: 'user_123',
        name: 'João Silva',
        email: loginData.email,
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        'Credenciais inválidas'
      );
    });

    it('deve lançar erro para usuário inativo', async () => {
      // Arrange
      const loginData = {
        email: 'joao@teste.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user_123',
        name: 'João Silva',
        email: loginData.email,
        password: 'hashed_password',
        isActive: false, // usuário inativo
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        'Conta desativada'
      );
    });
  });

  describe('validateToken', () => {
    it('deve validar token válido', async () => {
      // Arrange
      const token = 'valid_jwt_token';
      const decodedPayload = {
        userId: 'user_123',
        email: 'joao@teste.com',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      const mockUser = {
        id: 'user_123',
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedJwt.verify.mockReturnValue(decodedPayload as never);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: decodedPayload.userId },
      });
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        isActive: mockUser.isActive,
      });
    });

    it('deve lançar erro para token inválido', async () => {
      // Arrange
      const token = 'invalid_token';
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      // Act & Assert
      await expect(authService.validateToken(token)).rejects.toThrow(
        'Token inválido'
      );
    });
  });
});
