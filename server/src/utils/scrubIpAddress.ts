import { type ErrorEvent } from "@sentry/node";

// Request headers that carry the client IP address (PII). The requestData
// integration includes request headers by default while excluding user.ip_address,
// so these have to be scrubbed manually before sending the event to Sentry
const ipHeaders = new Set([
  "x-forwarded-for",
  "x-real-ip",
  "forwarded",
  "cf-connecting-ip",
  "true-client-ip",
  "x-client-ip",
  "x-cluster-client-ip",
]);

// Don't send the user's IP address to Sentry, it's Personally Identifiable Information (PII)
export const scrubIpAddress = (event: ErrorEvent): ErrorEvent => {
  if (event.user) {
    delete event.user.ip_address;
  }

  if (event.request?.headers) {
    event.request.headers = Object.fromEntries(
      Object.entries(event.request.headers).filter(
        ([header]) => !ipHeaders.has(header.toLowerCase()),
      ),
    );
  }

  return event;
};
