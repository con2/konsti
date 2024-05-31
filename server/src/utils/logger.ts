import { createLogger, format, Logger, transports } from "winston";
import { onUnhandledRejectionIntegration } from "@sentry/node";
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
  transports: [
    new transports.Console({
      level: config.server().debug ? "debug" : "info",
      handleExceptions: true,
      handleRejections: true,
      format: consoleOutputFormat,
    }),
    new Sentry({
      sentry: {
        dsn: getDsn(),
        integrations: [onUnhandledRejectionIntegration({ mode: "none" })],
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
  exitOnError: false,
});

export const stream = {
  write: (message: string): Logger => logger.info(message.slice(0, -1)), // Slice to remove line break
};
