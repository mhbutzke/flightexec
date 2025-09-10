import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Mock do Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Mock do logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock das APIs externas
jest.mock('axios');

// Mock do nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

// Configurar Prisma para testes
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

beforeAll(async () => {
  // Conectar ao Prisma
  await prisma.$connect();
});

// Limpeza após cada teste
afterEach(async () => {
  // Limpar dados do banco de teste (SQLite)
  try {
    await prisma.user.deleteMany({});
    await prisma.flight.deleteMany({});
  } catch (error) {
    console.log('Erro ao limpar dados de teste:', error);
  }
});

// Limpeza após todos os testes
afterAll(async () => {
  await prisma.$disconnect();
});
