import url from "node:url";
import axios from "axios";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/types/api/errors";

const sentryHost = "sentry.io";
const knownProjectIds = new Set(["/6579203", "/6578391", "/6579491"]);

interface ResendSentryError extends ApiError {
  errorId: "unknown";
}

export const resendSentryRequest = async (
  envelope: Buffer,
): Promise<null | ResendSentryError> => {
  try {
    const piece = envelope.subarray(0, envelope.indexOf("\n"));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const header = JSON.parse(piece.toString());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { host, pathname } = new url.URL(header.dsn as string);

    if (!host.includes(sentryHost)) {
      logger.error("%s", new Error(`invalid host: ${host}`));
      return {
        message: "Sentry tunnel: Invalid host",
        status: "error",
        errorId: "unknown",
      };
    }

    const projectId = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    if (!knownProjectIds.has(projectId)) {
      logger.error("%s", new Error(`invalid project id: ${projectId}`));
      return {
        message: "Sentry tunnel: Invalid project",
        status: "error",
        errorId: "unknown",
      };
    }

    const sentryUrl = `https://${sentryHost}/api/${projectId}/envelope/`;
    await axios.post<unknown>(sentryUrl, envelope, {
      headers: { "Content-Type": "application/x-sentry-envelope" },
    });

    return null;
  } catch (error) {
    logger.error("Sentry tunnel error: %s", error);
    return {
      message: "Sentry tunnel: Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }
};
