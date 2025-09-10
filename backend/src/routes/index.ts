import { Router } from 'express';
import authRoutes from './authRoutes';
import flightRoutes from './flightRoutes';
import alertRoutes from './alertRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FlightExec API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

export default router;