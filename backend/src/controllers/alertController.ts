import { Request, Response } from 'express';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Criar novo alerta
export const createAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const {
      name,
      departureCode,
      arrivalCode,
      departureDate,
      returnDate,
      maxPrice,
      minPrice,
      classType = 'business',
      maxStops,
      preferredAirlines = [],
      emailNotification = true,
      pushNotification = true
    } = req.body;

    // Validação básica
    if (!name || !departureCode || !arrivalCode) {
      res.status(400).json({
        success: false,
        message: 'Nome, código de origem e destino são obrigatórios'
      });
      return;
    }

    // Verificar se os aeroportos existem
    const [departureAirport, arrivalAirport] = await Promise.all([
      prisma.airport.findUnique({ where: { code: departureCode } }),
      prisma.airport.findUnique({ where: { code: arrivalCode } })
    ]);

    if (!departureAirport || !arrivalAirport) {
      res.status(400).json({
        success: false,
        message: 'Aeroporto de origem ou destino não encontrado'
      });
      return;
    }

    // Criar alerta
    const alert = await prisma.alert.create({
      data: {
        userId: authReq.user.id,
        name,
        departureCode,
        arrivalCode,
        departureDate: departureDate ? new Date(departureDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        classType,
        maxStops,
        preferredAirlines,
        emailNotification,
        pushNotification
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Alerta criado e será verificado automaticamente pelo cron job

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerta criado com sucesso'
    });

    logger.info(`Alerta criado: ${alert.id} para usuário ${authReq.user.id}`);
  } catch (error) {
    logger.error('Erro ao criar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar alertas do usuário
export const getUserAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const { page = 1, limit = 10, isActive } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      userId: authReq.user.id
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          notifications: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // Últimas 5 notificações
          }
        }
      }),
      prisma.alert.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

    logger.debug(`Alertas listados para usuário ${authReq.user.id}: ${alerts.length} resultados`);
  } catch (error) {
    logger.error('Erro ao listar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter detalhes de um alerta específico
export const getAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const { alertId } = req.params;

    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: authReq.user.id
      },
      include: {
        notifications: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: alert
    });

    logger.debug(`Detalhes do alerta ${alertId} consultados`);
  } catch (error) {
    logger.error('Erro ao obter alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar alerta
export const updateAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const { alertId } = req.params;
    const updateData = req.body;

    // Verificar se o alerta pertence ao usuário
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: authReq.user.id
      }
    });

    if (!existingAlert) {
      res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
      return;
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {};
    
    if (updateData.name) dataToUpdate.name = updateData.name;
    if (updateData.departureCode) dataToUpdate.departureCode = updateData.departureCode;
    if (updateData.arrivalCode) dataToUpdate.arrivalCode = updateData.arrivalCode;
    if (updateData.departureDate) dataToUpdate.departureDate = new Date(updateData.departureDate);
    if (updateData.returnDate) dataToUpdate.returnDate = new Date(updateData.returnDate);
    if (updateData.maxPrice !== undefined) dataToUpdate.maxPrice = updateData.maxPrice ? parseFloat(updateData.maxPrice) : null;
    if (updateData.minPrice !== undefined) dataToUpdate.minPrice = updateData.minPrice ? parseFloat(updateData.minPrice) : null;
    if (updateData.classType) dataToUpdate.classType = updateData.classType;
    if (updateData.maxStops !== undefined) dataToUpdate.maxStops = updateData.maxStops;
    if (updateData.preferredAirlines) dataToUpdate.preferredAirlines = updateData.preferredAirlines;
    if (updateData.emailNotification !== undefined) dataToUpdate.emailNotification = updateData.emailNotification;
    if (updateData.pushNotification !== undefined) dataToUpdate.pushNotification = updateData.pushNotification;
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

    // Atualizar alerta
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Alerta atualizado e será verificado automaticamente pelo cron job

    res.json({
      success: true,
      data: updatedAlert,
      message: 'Alerta atualizado com sucesso'
    });

    logger.info(`Alerta ${alertId} atualizado`);
  } catch (error) {
    logger.error('Erro ao atualizar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar alerta
export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const { alertId } = req.params;

    // Verificar se o alerta pertence ao usuário
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: authReq.user.id
      }
    });

    if (!existingAlert) {
      res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
      return;
    }

    // Alerta será removido automaticamente da verificação

    // Deletar alerta (cascade irá deletar notificações)
    await prisma.alert.delete({
      where: { id: alertId }
    });

    res.json({
      success: true,
      message: 'Alerta deletado com sucesso'
    });

    logger.info(`Alerta ${alertId} deletado`);
  } catch (error) {
    logger.error('Erro ao deletar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Testar alerta (executar verificação manual)
export const testAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const { alertId } = req.params;

    // Verificar se o alerta pertence ao usuário
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: authReq.user.id
      }
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
      return;
    }

    // Executar verificação manual do alerta
    const alertToCheck = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { user: true }
    });
    
    if (alertToCheck) {
      await alertService.checkSingleAlert(alertToCheck);
    }
    
    const result = { message: 'Verificação executada com sucesso' };

    res.json({
      success: true,
      data: {
        alertId,
        testResult: result,
        message: 'Teste do alerta executado com sucesso'
      }
    });

    logger.info(`Teste do alerta ${alertId} executado`);
  } catch (error) {
    logger.error('Erro ao testar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas dos alertas do usuário
export const getAlertStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const [totalAlerts, activeAlerts, triggeredAlerts, recentNotifications] = await Promise.all([
      prisma.alert.count({
        where: { userId: authReq.user.id }
      }),
      prisma.alert.count({
        where: { userId: authReq.user.id, isActive: true }
      }),
      prisma.alert.count({
        where: {
          userId: authReq.user.id,
          lastTriggered: { not: null }
        }
      }),
      prisma.notification.count({
        where: {
          alert: {
            userId: authReq.user.id
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
          }
        }
      })
    ]);

    const stats = {
      totalAlerts,
      activeAlerts,
      inactiveAlerts: totalAlerts - activeAlerts,
      triggeredAlerts,
      recentNotifications,
      successRate: totalAlerts > 0 ? (triggeredAlerts / totalAlerts * 100).toFixed(1) : '0'
    };

    res.json({
      success: true,
      data: stats
    });

    logger.debug(`Estatísticas de alertas consultadas para usuário ${authReq.user.id}`);
  } catch (error) {
    logger.error('Erro ao obter estatísticas de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export default {
  createAlert,
  getUserAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  testAlert,
  getAlertStats
};