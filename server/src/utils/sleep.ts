// An aborted signal ends the sleep early and clears its timer, so it holds no shutdown open
export const sleep = async (
  ms: number,
  signal?: AbortSignal,
): Promise<void> => {
  if (signal?.aborted) {
    return;
  }
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      // The signal can outlive many sleeps, so each removes its listener once it is done
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};
