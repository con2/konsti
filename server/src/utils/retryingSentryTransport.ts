import { makeNodeTransport } from "@sentry/node";
import { logger } from "server/utils/logger";
import {
  flattenErrorMessageChain,
  retryWithDelays,
  sentryRetryDelaysMs,
} from "server/utils/sentryRetry";

type NodeTransportOptions = Parameters<typeof makeNodeTransport>[0];
type NodeTransport = ReturnType<typeof makeNodeTransport>;
type TransportResponse = Awaited<ReturnType<NodeTransport["send"]>>;

type SendAttempt =
  | { delivered: true; response: TransportResponse }
  | { delivered: false; reason: string; response: TransportResponse }
  | { delivered: false; reason: string; rejection: unknown };

// 4xx responses count as delivered: they are final verdicts from Sentry, and
// 429 backoff stays with the SDK's rate limiter
const attemptSend = async (
  transport: NodeTransport,
  envelope: Parameters<NodeTransport["send"]>[0],
): Promise<SendAttempt> => {
  try {
    const response = await transport.send(envelope);
    if (response.statusCode !== undefined && response.statusCode >= 500) {
      return {
        delivered: false,
        reason: `upstream responded with ${response.statusCode}`,
        response,
      };
    }
    return { delivered: true, response };
  } catch (error) {
    return {
      delivered: false,
      reason: flattenErrorMessageChain(error),
      rejection: error,
    };
  }
};

// The default transport silently drops an envelope when the send fails or
// Sentry responds with 5xx, so retry each envelope with increasing delays
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
      const attempt = await retryWithDelays(
        sentryRetryDelaysMs,
        async () => attemptSend(transport, envelope),
        (result) => !result.delivered,
      );

      if (attempt.delivered) {
        sendFailing = false;
        return attempt.response;
      }

      reportDrop(attempt.reason);
      if ("response" in attempt) {
        return attempt.response;
      }
      // eslint-disable-next-line no-restricted-syntax -- Transport contract propagates send failures to the SDK as rejections
      throw attempt.rejection;
    },
  };
};
