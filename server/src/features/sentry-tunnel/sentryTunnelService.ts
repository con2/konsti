import url from "url";
import axios from "axios";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/typings/api/errors";

const sentryHost = "sentry.io";
const knownProjectIds = ["/6579203", "/6578391", "/6579491"];

export const resendSentryRequest = async (
  envelope: string
): Promise<null | ApiError> => {
  try {
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);

    const { host, pathname } = new url.URL(header.dsn as string);

    if (!host.includes(sentryHost)) {
      throw new Error(`invalid host: ${host}`);
    }

    const projectId = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    if (!knownProjectIds.includes(projectId)) {
      throw new Error(`invalid project id: ${projectId}`);
    }

    const sentryUrl = `https://${sentryHost}/api/${projectId}/envelope/`;
    await axios.post(sentryUrl, envelope, {
      headers: { "Content-Type": "text/plain" },
    });

    return null;
  } catch (error) {
    logger.error(`Sentry tunnel error: ${error}`);
    return {
      message: "Sentry tunnel error",
      status: "error",
      errorId: "unknown",
    };
  }
};