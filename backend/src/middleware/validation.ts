import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';

// Middleware para processar resultados de validação
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.debug('Erro de validação:', {
      path: req.path,
      method: req.method,
      errors: errorMessages,
    });

    res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errorMessages,
    });
    return;
  }

  next();
};

// Middleware para validar parâmetros de paginação
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { page, limit } = req.query;

  // Validar page
  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        success: false,
        message: 'Parâmetro "page" deve ser um número inteiro maior que 0',
      });
      return;
    }
    if (pageNum > 1000) {
      res.status(400).json({
        success: false,
        message: 'Parâmetro "page" não pode ser maior que 1000',
      });
      return;
    }
  }

  // Validar limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1) {
      res.status(400).json({
        success: false,
        message: 'Parâmetro "limit" deve ser um número inteiro maior que 0',
      });
      return;
    }
    if (limitNum > 100) {
      res.status(400).json({
        success: false,
        message: 'Parâmetro "limit" não pode ser maior que 100',
      });
      return;
    }
  }

  next();
};

// Middleware para validar datas
export const validateDateRange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { departureDate, returnDate } = req.query;

  if (departureDate) {
    const depDate = new Date(departureDate as string);
    if (isNaN(depDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Data de partida inválida',
      });
      return;
    }

    // Não permitir datas muito no passado (mais de 1 dia)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (depDate < yesterday) {
      res.status(400).json({
        success: false,
        message: 'Data de partida não pode ser no passado',
      });
      return;
    }

    // Não permitir datas muito no futuro (mais de 1 ano)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (depDate > oneYearFromNow) {
      res.status(400).json({
        success: false,
        message: 'Data de partida não pode ser mais de 1 ano no futuro',
      });
      return;
    }
  }

  if (returnDate) {
    const retDate = new Date(returnDate as string);
    if (isNaN(retDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Data de retorno inválida',
      });
      return;
    }

    if (departureDate) {
      const depDate = new Date(departureDate as string);
      if (retDate <= depDate) {
        res.status(400).json({
          success: false,
          message: 'Data de retorno deve ser posterior à data de partida',
        });
        return;
      }
    }
  }

  next();
};

// Middleware para validar códigos de aeroporto
export const validateAirportCodes = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { origin, destination } = req.query;

  if (origin) {
    const originCode = (origin as string).toUpperCase();
    if (!/^[A-Z]{3}$/.test(originCode)) {
      res.status(400).json({
        success: false,
        message: 'Código do aeroporto de origem deve ter 3 letras (ex: GRU)',
      });
      return;
    }
  }

  if (destination) {
    const destCode = (destination as string).toUpperCase();
    if (!/^[A-Z]{3}$/.test(destCode)) {
      res.status(400).json({
        success: false,
        message: 'Código do aeroporto de destino deve ter 3 letras (ex: GIG)',
      });
      return;
    }
  }

  if (origin && destination && origin === destination) {
    res.status(400).json({
      success: false,
      message: 'Aeroporto de origem e destino devem ser diferentes',
    });
    return;
  }

  next();
};

// Middleware para validar número de passageiros
export const validatePassengers = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { passengers } = req.query;

  if (passengers !== undefined) {
    const passengersNum = parseInt(passengers as string);
    if (isNaN(passengersNum) || passengersNum < 1) {
      res.status(400).json({
        success: false,
        message: 'Número de passageiros deve ser um número inteiro maior que 0',
      });
      return;
    }
    if (passengersNum > 9) {
      res.status(400).json({
        success: false,
        message: 'Número máximo de passageiros é 9',
      });
      return;
    }
  }

  next();
};

// Middleware para validar classe de voo
export const validateFlightClass = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { classType } = req.query;

  if (classType !== undefined) {
    const validClasses = ['business', 'economy', 'both'];
    if (!validClasses.includes(classType as string)) {
      res.status(400).json({
        success: false,
        message: 'Classe de voo deve ser: business, economy ou both',
      });
      return;
    }
  }

  next();
};

export default {
  validateRequest,
  validatePagination,
  validateDateRange,
  validateAirportCodes,
  validatePassengers,
  validateFlightClass,
};
