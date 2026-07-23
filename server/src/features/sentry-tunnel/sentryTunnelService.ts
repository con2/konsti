import url from "node:url";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/types/api/errors";

const sentryHost = "sentry.io";
const knownProjectIds = new Set(["/6579203", "/6578391", "/6579491"]);
const fetchTimeoutMs = 1000 * 15;
const retryDelayMs = 1000 * 2;

interface ResendSentryError extends ApiError {
  errorId: "unknown";
}

// Flatten the message chain (cause links and AggregateError members) into one
// line. Attaching the original error as `cause` instead would fingerprint each
// network failure mode into its own Sentry issue, and all upstream failures
// should track in a single issue
const describeFetchError = (error: unknown): string => {
  const messages: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    if (current.message) {
      messages.push(current.message);
    }
    if (current instanceof AggregateError) {
      for (const inner of current.errors) {
        messages.push(inner instanceof Error ? inner.message : String(inner));
      }
    }
    current = current.cause;
  }
  return messages.length > 0 ? messages.join(" / ") : String(error);
};

type ForwardAttempt =
  | { delivered: true }
  | { delivered: false; retryable: boolean; error: Error };

const attemptForward = async (
  sentryUrl: string,
  envelope: Buffer,
): Promise<ForwardAttempt> => {
  let response: Response;
  try {
    response = await fetch(sentryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: new Uint8Array(envelope),
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
  } catch (fetchError) {
    return {
      delivered: false,
      retryable: true,
      error: new Error(
        `Sentry tunnel: upstream request failed: ${describeFetchError(fetchError)}`,
      ),
    };
  }

  if (!response.ok) {
    // Sentry explains rejections in the x-sentry-error header and/or body
    const sentryError = response.headers.get("x-sentry-error");
    const body = (await response.text()).slice(0, 500);
    const details = [sentryError, body].filter(Boolean).join(" / ");
    return {
      delivered: false,
      // Retrying a 4xx would resend an envelope Sentry already rejected
      retryable: response.status >= 500,
      error: new Error(
        `Sentry tunnel: upstream responded with ${response.status}${details ? `: ${details}` : ""}`,
      ),
    };
  }

  return { delivered: true };
};

export const resendSentryRequest = async (
  envelope: Buffer,
): Promise<null | ResendSentryError> => {
  try {
    const piece = envelope.subarray(0, envelope.indexOf("\n"));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const header = JSON.parse(piece.toString());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { hostname, pathname } = new url.URL(header.dsn as string);

    if (!hostname.endsWith(`.${sentryHost}`)) {
      logger.error(new Error(`invalid host: ${hostname}`));
      return {
        message: "Sentry tunnel: Invalid host",
        status: "error",
        errorId: "unknown",
      };
    }

    const projectId = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    if (!knownProjectIds.has(projectId)) {
      logger.error(new Error(`invalid project id: ${projectId}`));
      return {
        message: "Sentry tunnel: Invalid project",
        status: "error",
        errorId: "unknown",
      };
    }

    const sentryUrl = `https://${hostname}/api${projectId}/envelope/`;

    // Upstream failures are usually transient load shedding, so retry once
    // after a short delay before logging the failure
    let attempt = await attemptForward(sentryUrl, envelope);
    if (!attempt.delivered && attempt.retryable) {
      await new Promise((resolve) => {
        setTimeout(resolve, retryDelayMs);
      });
      attempt = await attemptForward(sentryUrl, envelope);
    }

    if (!attempt.delivered) {
      logger.error(attempt.error);
      return {
        message: "Sentry tunnel: Upstream error",
        status: "error",
        errorId: "unknown",
      };
    }

    return null;
  } catch (error) {
    logger.error(new Error("Sentry tunnel error", { cause: error }));
    return {
      message: "Sentry tunnel: Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }
};
