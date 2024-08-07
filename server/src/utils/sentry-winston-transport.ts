/*
eslint-disable
@typescript-eslint/no-explicit-any,
@typescript-eslint/no-unsafe-argument,
@typescript-eslint/prefer-optional-chain,
@typescript-eslint/prefer-nullish-coalescing,
@typescript-eslint/no-confusing-void-expression,
@typescript-eslint/explicit-module-boundary-types,
@typescript-eslint/no-floating-promises,
@typescript-eslint/no-unnecessary-condition,
@typescript-eslint/consistent-indexed-object-style,
@typescript-eslint/explicit-function-return-type,
@typescript-eslint/no-require-imports,
@typescript-eslint/no-unsafe-assignment,
promise/catch-or-return,
promise/always-return,
*/

// https://github.com/aandrewww/winston-transport-sentry-node/tree/master

import {
  NodeOptions,
  SeverityLevel,
  captureException,
  captureMessage,
  flush,
  getCurrentScope,
  init,
} from "@sentry/node";
import TransportStream = require("winston-transport");
import { LEVEL } from "triple-beam";

enum SentrySeverity {
  Debug = "debug",
  Log = "log",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Fatal = "fatal",
}

const DEFAULT_LEVELS_MAP: SeverityOptions = {
  silly: SentrySeverity.Debug,
  verbose: SentrySeverity.Debug,
  info: SentrySeverity.Info,
  debug: SentrySeverity.Debug,
  warn: SentrySeverity.Warning,
  error: SentrySeverity.Error,
};

interface SentryTransportOptions
  extends TransportStream.TransportStreamOptions {
  sentry?: NodeOptions;
  levelsMap?: SeverityOptions;
  skipSentryInit?: boolean;
}

type SeverityOptions = Record<string, SeverityLevel>;

class ExtendedError extends Error {
  constructor(info: any) {
    super(info.message);

    this.name = info.name || "Error";
    if (info.stack && typeof info.stack === "string") {
      this.stack = info.stack;
    }
  }
}

export default class SentryTransport extends TransportStream {
  public silent = false;

  private levelsMap: SeverityOptions = {};

  public constructor(opts?: SentryTransportOptions) {
    super(opts);

    this.levelsMap = this.setLevelsMap(opts && opts.levelsMap);
    this.silent = (opts && opts.silent) || false;

    if (!opts || !opts.skipSentryInit) {
      init(SentryTransport.withDefaults((opts && opts.sentry) || {}));
    }
  }

  public log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (this.silent) return callback();

    const { message, tags, user, ...meta } = info;
    const winstonLevel = info[LEVEL];

    const sentryLevel = this.levelsMap[winstonLevel];

    getCurrentScope().clear().setTags(tags).setExtras(meta).setUser(user);

    // Capturing Errors / Exceptions
    if (SentryTransport.shouldLogException(sentryLevel)) {
      const error =
        Object.values(info).find((value) => value instanceof Error) ??
        new ExtendedError(info);
      captureException(error, { tags });

      return callback();
    }

    // Capturing Messages
    captureMessage(message, sentryLevel);
    return callback();
  }

  end(...args: any[]) {
    flush().then(() => {
      super.end(...args);
    });
    return this;
  }

  private setLevelsMap = (options?: SeverityOptions): SeverityOptions => {
    if (!options) {
      return DEFAULT_LEVELS_MAP;
    }

    const customLevelsMap = Object.keys(options).reduce<SeverityOptions>(
      (acc: { [key: string]: any }, winstonSeverity: string) => {
        acc[winstonSeverity] = options[winstonSeverity];
        return acc;
      },
      {},
    );

    return {
      ...DEFAULT_LEVELS_MAP,
      ...customLevelsMap,
    };
  };

  private static withDefaults(options: NodeOptions) {
    return {
      ...options,
      dsn: (options && options.dsn) || process.env.SENTRY_DSN || "",
      serverName:
        (options && options.serverName) || "winston-transport-sentry-node",
      environment:
        (options && options.environment) ||
        process.env.SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        "production",
      debug: (options && options.debug) || !!process.env.SENTRY_DEBUG || false,
      sampleRate: (options && options.sampleRate) || 1.0,
      maxBreadcrumbs: (options && options.maxBreadcrumbs) || 100,
    };
  }

  private static shouldLogException(level: SeverityLevel) {
    return level === SentrySeverity.Fatal || level === SentrySeverity.Error;
  }
}

/*
eslint-enable
@typescript-eslint/no-explicit-any,
@typescript-eslint/no-unsafe-argument,
@typescript-eslint/prefer-optional-chain,
@typescript-eslint/prefer-nullish-coalescing,
@typescript-eslint/no-confusing-void-expression,
@typescript-eslint/explicit-module-boundary-types,
@typescript-eslint/no-floating-promises,
@typescript-eslint/no-unnecessary-condition,
@typescript-eslint/consistent-indexed-object-style,
@typescript-eslint/explicit-function-return-type,
@typescript-eslint/no-require-imports,
@typescript-eslint/no-unsafe-assignment,
promise/catch-or-return,
promise/always-return,
*/
