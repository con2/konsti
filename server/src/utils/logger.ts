import { createLogger, format, Logger, transports } from "winston";
import Sentry from "./sentry-winston-transport";
import { config } from "shared/config";
import { getDsn } from "server/utils/instrument";

const consoleOutputFormat = config.server().consoleLogFormatJson
  ? format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => {
        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
        });
      }),
    )
  : format.combine(
      format.colorize(),
      format.timestamp({
        format: "HH:mm:ss",
      }),
      format.splat(),
      format.printf((info) => {
        return `${info.timestamp} ${info.level}: ${info.message}`;
      }),
    );

export const logger = createLogger({
  handleExceptions: true,
  handleRejections: true,

  transports: [
    new transports.Console({
      level: config.server().debug ? "debug" : "info",
      format: consoleOutputFormat,
    }),

    new Sentry({
      sentry: {
        dsn: getDsn(),
      },
      level: "error",
      format: format.combine(
        format.timestamp(),
        format.splat(),
        format.printf((info) => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            message: info.message,
          });
        }),
      ),
    }),
  ],
});

export const accessLogStream = {
  write: (message: string): Logger => logger.info(message.slice(0, -1)), // Slice to remove line break
};
