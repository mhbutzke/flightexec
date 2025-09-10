import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// POST /api/search - Buscar voos em tempo real
router.post('/', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar busca em tempo real
    res.json({
      message: 'Busca em tempo real - em desenvolvimento',
      body: req.body,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/search/history - Histórico de buscas
router.get('/history', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar histórico de buscas
    res.json({
      message: 'Histórico de buscas - em desenvolvimento',
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
