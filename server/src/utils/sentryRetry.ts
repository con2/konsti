import { getCauseChain } from "server/utils/causeChain";
import { sleep } from "server/utils/sleep";

// Shared retry policy for delivering envelopes to Sentry, used by both the
// browser envelope tunnel and the backend SDK transport. Sentry's edge
// suggests trying again in 30 seconds when its backend is unreachable, so the
// second retry waits that long.
export const sentryRetryDelaysMs = [1000 * 2, 1000 * 30];

export const retryWithDelays = async <T>(
  delaysMs: number[],
  run: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
): Promise<T> => {
  let result = await run();
  for (const delayMs of delaysMs) {
    if (!shouldRetry(result)) {
      break;
    }
    await sleep(delayMs);
    result = await run();
  }
  return result;
};

// Flatten the message chain (cause links and AggregateError members) into one
// line. Attaching the original error as `cause` to a logged Error instead
// would fingerprint each network failure mode into its own Sentry issue.
export const flattenErrorMessageChain = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const messages: string[] = [];
  for (const current of getCauseChain(error).errors) {
    if (current.message) {
      messages.push(current.message);
    }
    if (current instanceof AggregateError) {
      for (const inner of current.errors) {
        messages.push(inner instanceof Error ? inner.message : String(inner));
      }
    }
  }
  return messages.length > 0 ? messages.join(" / ") : String(error);
};
