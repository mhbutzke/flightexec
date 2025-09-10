import winston from 'winston';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'flightexec-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    
    // Write error logs to file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      )
    }),
    
    // Write all logs to file
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      )
    })
  ],
});

// If we're not in production, log to the console with simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    )
  }));
}

export default logger;