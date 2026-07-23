import { makeNodeTransport } from "@sentry/node";
import { logger } from "server/utils/logger";

const retryDelayMs = 1000 * 2;

type NodeTransportOptions = Parameters<typeof makeNodeTransport>[0];
type NodeTransport = ReturnType<typeof makeNodeTransport>;

// The default transport silently drops an envelope when the send fails or
// Sentry responds with 5xx, so give each envelope one delayed retry. 4xx
// passes through untouched and 429 backoff stays with the SDK's rate limiter
export const makeRetryingNodeTransport = (
  options: NodeTransportOptions,
): NodeTransport => {
  const transport = makeNodeTransport(options);

  // Tracks the failing state so each outage logs one Sentry-bound error when
  // it starts; repeats during the episode only warn to the console. Without
  // this a failed drop report would feed itself back into the failing
  // transport forever
  let sendFailing = false;

  const reportDrop = (reason: string): void => {
    const message = `Sentry event dropped: ${reason}`;
    if (sendFailing) {
      logger.warn(message);
      return;
    }
    sendFailing = true;
    logger.error(new Error(message));
  };

  return {
    ...transport,
    send: async (envelope) => {
      try {
        const response = await transport.send(envelope);
        if (response.statusCode === undefined || response.statusCode < 500) {
          sendFailing = false;
          return response;
        }
      } catch {
        // Network-level failure, fall through to the retry
      }

      await new Promise((resolve) => {
        setTimeout(resolve, retryDelayMs);
      });

      try {
        const response = await transport.send(envelope);
        if (response.statusCode !== undefined && response.statusCode >= 500) {
          reportDrop(`upstream responded with ${response.statusCode}`);
        } else {
          sendFailing = false;
        }
        return response;
      } catch (error) {
        reportDrop(error instanceof Error ? error.message : String(error));
        // eslint-disable-next-line no-restricted-syntax -- Transport contract propagates send failures to the SDK as rejections
        throw error;
      }
    },
  };
};
