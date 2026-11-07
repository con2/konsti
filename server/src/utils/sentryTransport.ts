import { captureException, captureMessage, withScope } from "@sentry/node";
import TransportStream from "winston-transport";
import { getCauseChain } from "server/utils/causeChain";

// Only a primitive is sent as is: an object could carry request data or credentials that
// the SDK's data collection settings would otherwise keep out of Sentry
const describeNonErrorCause = (cause: unknown): string => {
  if (typeof cause === "object" && cause !== null) {
    return Object.prototype.toString.call(cause);
  }
  return String(cause);
};

// Reports each log it receives to Sentry. The logger's format puts the logged
// Error on `info.error`; a log without one is reported as a message, which Sentry
// groups by its text only while the SDK is set not to attach stacks to messages.
export class SentryTransport extends TransportStream {
  override log(info: Record<string, unknown>, next: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { error, message, ...extras } = info;
    withScope((scope) => {
      scope.setExtras(extras);
      if (error instanceof Error) {
        // Sentry follows only Error causes, so a caught non-Error would otherwise be dropped
        const { nonErrorCause } = getCauseChain(error);
        if (nonErrorCause !== undefined) {
          scope.setExtra("cause", describeNonErrorCause(nonErrorCause));
        }
        captureException(error, { level: "error" });
      } else {
        captureMessage(String(message), "error");
      }
    });
    next();
  }
}
