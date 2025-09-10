import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { generalRateLimit } from './middleware/rateLimitMiddleware';
import { sanitizeInput } from './middleware/sanitization';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// Routes
import flightRoutes from './routes/flightRoutes';
import alertRoutes from './routes/alertRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);
app.use(generalRateLimit);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// WebSocket connection handling
io.on('connection', socket => {
  logger.info(`Cliente conectado: ${socket.id}`);

  socket.on('join-alerts', userId => {
    socket.join(`user-${userId}`);
    logger.info(`Usuário ${userId} entrou no canal de alertas`);
  });

  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });
});

// Make io available globally
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
  });
});

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Conexão com banco de dados estabelecida');

    // Connect to Redis
    await connectRedis();
    logger.info('Conexão com Redis estabelecida');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

startServer();

export { io };
export default app;
