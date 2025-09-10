import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Classe para erros de validação
export class ValidationError extends CustomError {
  constructor(message: string, field?: string) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Classe para erros de autenticação
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Token de autenticação inválido') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

// Classe para erros de autorização
export class AuthorizationError extends CustomError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

// Classe para erros de recurso não encontrado
export class NotFoundError extends CustomError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

// Classe para erros de conflito
export class ConflictError extends CustomError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

// Função para tratar erros do Prisma
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): CustomError {
  switch (error.code) {
    case 'P2002':
      return new ConflictError('Dados duplicados. Este registro já existe.');
    case 'P2025':
      return new NotFoundError('Registro não encontrado.');
    case 'P2003':
      return new ValidationError('Violação de chave estrangeira.');
    case 'P2014':
      return new ValidationError('Dados inválidos fornecidos.');
    default:
      logger.error('Erro do Prisma não tratado:', { code: error.code, message: error.message });
      return new CustomError('Erro interno do servidor', 500, false);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError: CustomError;

  // Verificar se é um erro customizado
  if (error instanceof CustomError) {
    customError = error;
  }
  // Tratar erros do Prisma
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    customError = handlePrismaError(error);
  }
  // Tratar erros de JWT
  else if (error.name === 'JsonWebTokenError') {
    customError = new AuthenticationError('Token inválido');
  }
  else if (error.name === 'TokenExpiredError') {
    customError = new AuthenticationError('Token expirado');
  }
  // Tratar erros de sintaxe JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    customError = new ValidationError('JSON inválido no corpo da requisição');
  }
  // Erro genérico
  else {
    customError = new CustomError(
      error.message || 'Erro interno do servidor',
      500,
      false
    );
  }

  // Log do erro
  const errorLog = {
    message: customError.message,
    statusCode: customError.statusCode,
    code: customError.code,
    stack: customError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  if (customError.statusCode >= 500) {
    logger.error('Erro do servidor:', errorLog);
  } else {
    logger.warn('Erro do cliente:', errorLog);
  }

  // Resposta para o cliente
  const response: any = {
    success: false,
    error: {
      message: customError.message,
      code: customError.code,
      statusCode: customError.statusCode,
    },
  };

  // Em desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = customError.stack;
  }

  res.status(customError.statusCode).json(response);
};

// Middleware para capturar rotas não encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Rota ${req.method} ${req.path} não encontrada`);
  next(error);
};

// Função para criar respostas de sucesso padronizadas
export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Operação realizada com sucesso',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
