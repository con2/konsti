import { createLogger, format, transports } from "winston";
import _WinstonTransport from "winston-transport-sentry-node";
// Node.js ESM CJS interop: package uses exports.default, so the class is wrapped as { default: Class }
const WinstonTransport = (
  _WinstonTransport as unknown as { default: typeof _WinstonTransport }
).default;
import { config } from "shared/config";

const SPLAT = Symbol.for("splat");

// winston's `%s` formatting collapses an Error's `cause` to `[Error]`; expand the
// whole chain so the underlying error stays visible in logs
const expandErrorCauses = format((info) => {
  const args = (info as Record<symbol, unknown>)[SPLAT];
  if (Array.isArray(args)) {
    (info as Record<symbol, unknown>)[SPLAT] = args.map((arg: unknown) => {
      if (!(arg instanceof Error)) {
        return arg;
      }
      let text = arg.stack ?? String(arg);
      for (let cause = arg.cause; cause instanceof Error; cause = cause.cause) {
        text += `\nCaused by: ${cause.stack ?? String(cause)}`;
      }
      return text;
    });
  }
  return info;
});

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
        return `${String(info.timestamp)} ${info.level}: ${String(info.message)}`;
      }),
    );

export const logger = createLogger({
  handleExceptions: true,
  handleRejections: true,
  format: expandErrorCauses(),

  transports: [
    new transports.Console({
      level: config.server().debug ? "debug" : "info",
      format: consoleOutputFormat,
    }),

    new WinstonTransport({
      // Sentry SDK is already initialized in instrument.ts
      skipSentryInit: true,
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
