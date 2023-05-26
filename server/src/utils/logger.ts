import { createLogger, format, Logger, transports } from "winston";
import Sentry from "winston-transport-sentry-node";
import { Integrations } from "@sentry/node";
import { config } from "server/config";
import { getDsn } from "server/utils/sentry";

const formatMessage = (message: string | object): string => {
  if (typeof message === "string") {
    return message;
  } else {
    return JSON.stringify(message, null, 2);
  }
};

const consoleOutputFormat = config.consoleLogFormatJson
  ? format.combine(
      format.timestamp(),
      format.printf((info) => {
        return JSON.stringify({
          level: info.level,
          message: info.message,
          timestamp: info.timestamp,
        });
      })
    )
  : format.combine(
      format.colorize(),
      format.timestamp({
        format: "HH:mm:ss",
      }),
      format.printf((info) => {
        return `${info.timestamp} ${info.level}: ${formatMessage(
          info.message as string | object
        )}`;
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
    }),
  ],
  exitOnError: false,
});

export const stream = {
  write: (message: string): Logger => logger.info(message.slice(0, -1)), // Slice to remove line break
};
