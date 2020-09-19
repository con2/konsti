import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import 'winston-daily-rotate-file';
import { config } from 'config';

const { combine, printf, colorize, timestamp, json, errors } = format;
const { logDir, debug } = config;

// Create logs directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const loggerLevel = (): string => {
  if (debug) return 'debug';
  else return 'info';
};

const formatMessage = (message: string | object): string => {
  if (typeof message === 'string') {
    return message;
  } else {
    return JSON.stringify(message, null, 2);
  }
};

export const logger = createLogger({
  format: errors({ stack: true }),
  transports: [
    new transports.DailyRotateFile({
      level: 'info', // info, debug, warn, error
      filename: `${logDir}/%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      // maxFiles: '14d',
      zippedArchive: false,
      format: combine(timestamp(), json()),
    }),

    new transports.Console({
      level: loggerLevel(),
      format: combine(
        colorize(),
        timestamp({
          format: 'HH:mm:ss',
        }),
        printf((info) => {
          return `${info.timestamp} ${info.level}: ${formatMessage(
            info.message
          )}`;
        })
      ),
    }),
  ],
  exitOnError: false,
});

export const stream = {
  write: (message: string) => logger.info(message.slice(0, -1)), // Slice to remove line break
};
