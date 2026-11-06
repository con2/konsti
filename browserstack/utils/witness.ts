import type { Browser } from "webdriverio";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export interface WitnessEvent {
  at: number;
  pageshow?: boolean;
  pagehide?: boolean;
  visibility?: string;
}

interface Witness {
  loads: number[] | null;
  events: WitnessEvent[] | null;
  raw?: unknown;
}

declare global {
  interface Window {
    __settingsLoads?: number[];
    __events?: WitnessEvent[];
  }
}

// In-page witnesses: the settings request that starts every data load, and
// the lifecycle events. They survive a lock, a backgrounding and a bfcache
// restore, and are lost on a full reload, which is itself a result. The
// function runs in the phone's browser, so the endpoint goes in as an argument.
export const installWitness = async (browser: Browser): Promise<void> => {
  await browser.execute((settingsEndpoint: string) => {
    const loads: number[] = [];
    const events: WitnessEvent[] = [];
    window.__settingsLoads = loads;
    window.__events = events;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const request = new Request(input, init);
      if (
        request.method === "GET" &&
        new URL(request.url).pathname === settingsEndpoint
      ) {
        loads.push(Date.now());
      }
      return originalFetch(input, init);
    };
    addEventListener("pageshow", (event) => {
      events.push({ pageshow: event.persisted, at: Date.now() });
    });
    addEventListener("pagehide", (event) => {
      events.push({ pagehide: event.persisted, at: Date.now() });
    });
    document.addEventListener("visibilitychange", () => {
      events.push({ visibility: document.visibilityState, at: Date.now() });
    });
  }, ApiEndpoint.SETTINGS);
};

// A session whose window handle went stale answers commands with an error
// object instead of a value, so the shape is checked and the raw answer kept
export const readWitness = async (browser: Browser): Promise<Witness> => {
  const raw: unknown = await browser.execute(() => {
    return {
      loads: window.__settingsLoads ?? null,
      events: window.__events ?? null,
    };
  });
  const witness = raw as Partial<Witness> | null;
  if (
    witness &&
    (witness.loads === null || Array.isArray(witness.loads)) &&
    (witness.events === null || Array.isArray(witness.events))
  ) {
    return { loads: witness.loads ?? null, events: witness.events ?? null };
  }
  // An error object instead of the witness means the session itself broke,
  // which says nothing about the app, so it fails the scenario rather than
  // passing for a reloaded page
  if (
    raw !== null &&
    typeof raw === "object" &&
    "message" in raw &&
    typeof raw.message === "string"
  ) {
    throw new Error(`The BrowserStack session broke: ${raw.message}`);
  }
  return { loads: null, events: null, raw };
};

// The phone's clock, so witness timestamps compare against the same clock
export const deviceNow = async (browser: Browser): Promise<number> => {
  return browser.execute(() => Date.now());
};
