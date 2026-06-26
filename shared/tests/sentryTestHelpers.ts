import type {
  BaseTransportOptions,
  Envelope,
  Event,
  Transport,
} from "@sentry/core";

// Obviously fake DSN - combined with the recording transport below, no event
// ever leaves the process, so tests never hit the real Sentry
export const fakeDsn = "https://examplePublicKey@o0.ingest.sentry.io/0";

interface RecordingTransport {
  // Pass to Sentry.init({ transport }) to record envelopes instead of sending them
  transport: (transportOptions: BaseTransportOptions) => Transport;
  // The error events recorded so far
  getCapturedEvents: () => Event[];
}

// Replace Sentry's transport with one that just records the envelopes it would
// have sent, so tests can assert on the captured error events. The same envelope
// and event types are shared by @sentry/node and @sentry/react via @sentry/core,
// so this works for both the server and client SDKs
export const createRecordingTransport = (): RecordingTransport => {
  const envelopes: Envelope[] = [];

  return {
    transport: () => ({
      send: (envelope) => {
        envelopes.push(envelope);
        return Promise.resolve({});
      },
      flush: () => Promise.resolve(true),
    }),

    getCapturedEvents: () => {
      const events: Event[] = [];
      for (const envelope of envelopes) {
        for (const [itemHeader, payload] of envelope[1]) {
          if (itemHeader.type === "event") {
            events.push(payload as Event);
          }
        }
      }
      return events;
    },
  };
};
