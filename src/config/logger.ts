import winston from 'winston';
import * as dotenv from 'dotenv';

dotenv.config();

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${
      stack ? '\n' + stack : ''
    }`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/app.log',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      format: logFormat,
    }),
  ],
});

export default logger;