import { inspect } from "node:util";
import type { TransformableInfo } from "logform";
import { type Logger, createLogger, format, transports } from "winston";
import { config } from "shared/config";
import { getCauseChain } from "server/utils/causeChain";
import { SentryTransport } from "server/utils/sentryTransport";

const LEVEL = Symbol.for("level");

// Surfaces the Error onto an enumerable `error` key, where the Sentry transport looks for it:
// logged on its own, the Error is `info` itself, and a transport with its own format gets a
// copy of `info` that has lost the Error's non-enumerable `message`/`stack`.
const surfaceError = format((info) => {
  // sole-arg Error: winston makes `info` the Error itself, unless its message is empty, in
  // which case winston wraps it as `{ message: error }` instead
  const error =
    info instanceof Error
      ? info
      : info.message instanceof Error
        ? info.message
        : null;
  if (!error) {
    return info;
  }
  // A fresh info, so we don't mutate the caller's Error or create a circular self-reference
  // through `error`
  const next: TransformableInfo = {
    level: info.level,
    message: error.message,
    error,
  };
  (next as Record<symbol, unknown>)[LEVEL] = (info as Record<symbol, unknown>)[
    LEVEL
  ];
  return next;
});

// Build the human-readable message for console/file logs: the full stack plus the whole
// `cause` chain when the log carries an Error (Sentry instead gets the raw Error object via
// the transport, so this is only for the text logs)
const renderMessage = (info: TransformableInfo): string => {
  const error = info.error;
  if (error instanceof Error) {
    const { errors, nonErrorCause } = getCauseChain(error);
    const lines = errors.map((chained) => {
      return chained.stack ?? String(chained);
    });
    // A caught value can be anything, and it is the only record of what actually failed
    if (nonErrorCause !== undefined) {
      lines.push(inspect(nonErrorCause));
    }
    return lines.join("\nCaused by: ");
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

// Requiring an Error makes Sentry group error logs by stack rather than by interpolated text.
// The type cannot cover values thrown at runtime, such as the error middleware's `err`.
type KonstiLogger = Omit<Logger, "error"> & {
  error: (error: Error) => KonstiLogger;
};

export const logger: KonstiLogger = createLogger({
  handleExceptions: true,
  handleRejections: true,
  format: surfaceError(),

  transports: [
    new transports.Console({
      level: config.server().logLevel,
      format: consoleOutputFormat,
    }),

    new SentryTransport({ level: "error" }),
  ],
});
