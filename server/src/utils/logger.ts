import { createLogger, format, transports } from "winston";
import type { TransformableInfo } from "logform";
import _WinstonTransport from "winston-transport-sentry-node";
// Node.js ESM CJS interop: package uses exports.default, so the class is wrapped as { default: Class }
const WinstonTransport = (
  _WinstonTransport as unknown as { default: typeof _WinstonTransport }
).default;
import { config } from "shared/config";

const SPLAT = Symbol.for("splat");
const LEVEL = Symbol.for("level");

// Log errors by passing the Error directly: `logger.error(new Error("..."))`, or wrap an
// underlying error as the cause: `logger.error(new Error("context", { cause: err }))`
//
// Surfaces the Error onto an enumerable `error` key because winston-transport-sentry-node
// only captures a real exception when it finds an Error among `info`'s enumerable values,
// and winston-transport's `Object.assign` copy drops an Error's non-enumerable `message`/`stack`
const surfaceError = format((info) => {
  if (info instanceof Error) {
    // sole-arg Error: winston makes `info` the Error itself. Return a fresh info so we don't
    // mutate the caller's Error or create a circular self-reference through `error`
    const next: TransformableInfo = {
      level: info.level,
      message: info.message,
      error: info,
    };
    (next as Record<symbol, unknown>)[LEVEL] = (
      info as Record<symbol, unknown>
    )[LEVEL];
    return next;
  }
  const args = (info as Record<symbol, unknown>)[SPLAT];
  if (Array.isArray(args)) {
    const error = args.find((arg: unknown) => arg instanceof Error);
    if (error) {
      info.error = error;
    }
  }
  return info;
});

// Build the human-readable message for console/file logs: the full stack plus the whole
// `cause` chain when the log carries an Error (Sentry instead gets the raw Error object via
// the transport, so this is only for the text logs)
const renderMessage = (info: TransformableInfo): string => {
  const error = info.error;
  if (error instanceof Error) {
    let text = error.stack ?? String(error);
    for (let cause = error.cause; cause instanceof Error; cause = cause.cause) {
      text += `\nCaused by: ${cause.stack ?? String(cause)}`;
    }
    return text;
  }
  const { message } = info;
  if (typeof message === "string") {
    return message;
  }
  return message == null ? "" : JSON.stringify(message);
};

const consoleOutputFormat = config.server().consoleLogFormatJson
  ? format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => {
        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: renderMessage(info),
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
        return `${String(info.timestamp)} ${info.level}: ${renderMessage(info)}`;
      }),
    );

export const logger = createLogger({
  handleExceptions: true,
  handleRejections: true,
  format: surfaceError(),

  transports: [
    new transports.Console({
      level: config.server().logLevel,
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
            message: renderMessage(info),
          });
        }),
      ),
    }),
  ],
});
