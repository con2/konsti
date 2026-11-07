import { captureException, captureMessage, withScope } from "@sentry/node";
import TransportStream from "winston-transport";

// Reports each log it receives to Sentry. The logger's format puts the logged
// Error on `info.error`; a log without one is reported as a message, so Sentry
// groups it by its text rather than by a stack that starts in this transport.
export class SentryTransport extends TransportStream {
  override log(info: Record<string, unknown>, next: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { error, message, ...extras } = info;
    withScope((scope) => {
      scope.setExtras(extras);
      if (error instanceof Error) {
        captureException(error, { level: "error" });
      } else {
        captureMessage(String(message), "error");
      }
    });
    next();
  }
}
