import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 60000,
  },
});

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient.on('error', err => {
      logger.error('Erro no Redis:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Conectando ao Redis...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis pronto para uso');
    });

    await redisClient.connect();
    logger.info('Conexão com Redis estabelecida com sucesso');
  } catch (error) {
    logger.error('Erro ao conectar com Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Conexão com Redis encerrada');
    }
  } catch (error) {
    logger.error('Erro ao desconectar do Redis:', error);
  }
};

export { redisClient };
export default redisClient;
