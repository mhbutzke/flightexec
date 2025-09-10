import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Conexão com PostgreSQL estabelecida com sucesso');
  } catch (error) {
    logger.error('Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Conexão com PostgreSQL encerrada');
  } catch (error) {
    logger.error('Erro ao desconectar do banco de dados:', error);
  }
};

export { prisma };
export default prisma;
