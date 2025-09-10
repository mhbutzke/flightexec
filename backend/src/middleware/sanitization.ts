import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Configurar DOMPurify para ambiente Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitiza recursivamente um objeto removendo scripts maliciosos
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Remove scripts e tags perigosas
    return purify.sanitize(obj, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware para sanitizar dados de entrada
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Erro na sanitização:', error);
    res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
    });
  }
};

/**
 * Middleware específico para sanitizar campos de texto
 */
export const sanitizeTextFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        fields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            // Sanitização mais rigorosa para campos específicos
            req.body[field] = purify.sanitize(req.body[field], {
              ALLOWED_TAGS: [],
              ALLOWED_ATTR: [],
              KEEP_CONTENT: true,
            }).trim();
          }
        });
      }
      next();
    } catch (error) {
      console.error('Erro na sanitização de campos de texto:', error);
      res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
      });
    }
  };
};

/**
 * Valida e sanitiza emails
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Remove espaços e converte para minúsculas
  const sanitized = email.trim().toLowerCase();
  
  // Sanitiza com DOMPurify
  return purify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Valida e sanitiza senhas (remove apenas scripts, mantém caracteres especiais)
 */
export const sanitizePassword = (password: string): string => {
  if (!password || typeof password !== 'string') {
    return '';
  }

  // Apenas remove scripts maliciosos, mantém caracteres especiais para senhas
  return purify.sanitize(password, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitiza dados de busca de voos
 */
export const sanitizeFlightSearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const { origin, destination, departureDate, returnDate, passengers } = req.body;
      
      req.body = {
        ...req.body,
        origin: origin ? purify.sanitize(origin.toString().trim().toUpperCase()) : '',
        destination: destination ? purify.sanitize(destination.toString().trim().toUpperCase()) : '',
        departureDate: departureDate ? purify.sanitize(departureDate.toString().trim()) : '',
        returnDate: returnDate ? purify.sanitize(returnDate.toString().trim()) : '',
        passengers: passengers && !isNaN(Number(passengers)) ? Math.max(1, Math.min(9, Number(passengers))) : 1,
      };
    }
    
    next();
  } catch (error) {
    console.error('Erro na sanitização de busca de voos:', error);
    res.status(400).json({
      success: false,
      message: 'Dados de busca inválidos',
    });
  }
};