// Change to AbortSignal.timeout() at some point when browsers mature more.
// A caller-provided signal would be silently overridden by the timeout
// signal, so the type forbids passing one. The timer is deliberately never
// cleared: it must also bound reading the response body (a connection can
// stall mid-body without ever erroring), and aborting an already-settled
// request is a no-op
export const fetchWithTimeout = async (
  url: string,
  timeoutMs: number,
  init?: Omit<RequestInit, "signal">,
): Promise<Response> => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return await fetch(url, { ...init, signal: controller.signal });
};
