import { captureException, withScope } from "@sentry/node";
import TransportStream from "winston-transport";

// Reports each log it receives to Sentry as an exception. The logger's format puts
// the logged Error on `info.error`; a log without one is reported from its message
export class SentryTransport extends TransportStream {
  override log(info: Record<string, unknown>, next: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { error, message, ...extras } = info;
    withScope((scope) => {
      scope.setExtras(extras);
      captureException(
        error instanceof Error ? error : new Error(String(message)),
        { level: "error" },
      );
    });
    next();
  }
}
