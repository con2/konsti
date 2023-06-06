import { createLogger, format, Logger, transports } from "winston";
import Sentry from "winston-transport-sentry-node";
import { Integrations } from "@sentry/node";
import { config } from "server/config";
import { getDsn } from "server/utils/sentry";

const consoleOutputFormat = config.consoleLogFormatJson
  ? format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => {
        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
        });
      })
    )
  : format.combine(
      format.colorize(),
      format.timestamp({
        format: "HH:mm:ss",
      }),
      format.splat(),
      format.printf((info) => {
        return `${info.timestamp} ${info.level}: ${info.message}`;
      })
    );

export const logger = createLogger({
  transports: [
    new transports.Console({
      level: config.debug ? "debug" : "info",
      handleExceptions: true,
      handleRejections: true,
      format: consoleOutputFormat,
    }),
    new Sentry({
      sentry: {
        dsn: getDsn(true),
        integrations: [
          new Integrations.OnUnhandledRejection({
            mode: "none",
          }),
        ],
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
        })
      ),
    }),
  ],
  exitOnError: false,
});

export const stream = {
  write: (message: string): Logger => logger.info(message.slice(0, -1)), // Slice to remove line break
};
