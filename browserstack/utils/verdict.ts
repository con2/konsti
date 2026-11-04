import { setTimeout as sleep } from "node:timers/promises";
import type { Browser } from "webdriverio";
import { waitForItem } from "./page.ts";
import type { Probe } from "./testServer.ts";
import { type WitnessEvent, readWitness } from "./witness.ts";

export const verbose = process.env.BROWSERSTACK_VERBOSE === "1";

export interface Observation {
  // The witness was gone, so the page reloaded instead of resuming
  reloaded: boolean;
  loads: number;
  firstLoadAfterShownMs: number | null;
  appearedAfterMs: number | null;
  // A pageshow with persisted set: the page came back from the bfcache
  restored: boolean;
  events: WitnessEvent[];
  raw?: unknown;
}

// After the action: how many data loads started since `before` (device
// time), how soon after the page was shown again, and whether the probe
// rendered on its own
export const observeAfter = async (
  browser: Browser,
  probe: Probe,
  before: number,
  waitForItemMs: number,
): Promise<Observation> => {
  const appeared = await waitForItem(browser, probe.title, waitForItemMs);
  await sleep(1500);
  const witness = await readWitness(browser);
  if (witness.loads === null || witness.events === null) {
    return {
      reloaded: true,
      loads: 0,
      firstLoadAfterShownMs: null,
      appearedAfterMs: appeared,
      restored: false,
      events: [],
      raw: witness.raw,
    };
  }
  const newLoads = witness.loads.filter((at) => at > before);
  const events = witness.events.filter((event) => event.at > before);
  // The first show is the one the resume load answers; a wake or a bfcache
  // restore can report the page shown more than once
  const shown = events.find((event) => {
    return event.visibility === "visible" || event.pageshow !== undefined;
  });
  const firstLoad = newLoads.at(0);
  return {
    reloaded: false,
    loads: newLoads.length,
    firstLoadAfterShownMs:
      firstLoad !== undefined && shown ? firstLoad - shown.at : null,
    appearedAfterMs: appeared,
    restored: events.some((event) => event.pageshow === true),
    events: events.map((event) => ({ ...event, at: event.at - before })),
  };
};

type Verdict = "PASS" | "FAIL" | "UNCLEAR";

export interface Outcome {
  verdict: Verdict;
  summary: string;
  details: Record<string, unknown>;
}

// The verdict for a scenario where the page was away past a poll: exactly one
// load right after it was shown again, and the item rendered from it
export const resumeOutcome = (
  observation: Observation,
  extra: Record<string, unknown> = {},
): Outcome => {
  const details = { ...extra, ...observation };
  if (observation.reloaded) {
    return {
      verdict: "UNCLEAR",
      summary:
        "the page reloaded instead of resuming, so the resume path was not exercised",
      details,
    };
  }
  const { loads, firstLoadAfterShownMs, appearedAfterMs } = observation;
  const problems: string[] = [];
  if (loads === 0) {
    problems.push("no load after the page was shown again");
  }
  if (loads > 1) {
    problems.push(`${loads} loads after shown (expected 1)`);
  }
  if (loads > 0 && firstLoadAfterShownMs === null) {
    problems.push("no show event recorded to place the load against");
  }
  // A load from before the page was shown is a hidden page polling, which is
  // the regression this exists to catch; the witness's own listener runs a
  // few milliseconds after the app's, hence the slack
  if (firstLoadAfterShownMs !== null && firstLoadAfterShownMs < -1000) {
    problems.push(
      `the load came ${-firstLoadAfterShownMs} ms before the page was shown, so the hidden page polled`,
    );
  }
  if (appearedAfterMs === null) {
    problems.push("the item never appeared");
  }
  if (problems.length > 0) {
    return { verdict: "FAIL", summary: problems.join(", "), details };
  }
  return {
    verdict: "PASS",
    summary: `1 load ${firstLoadAfterShownMs} ms after shown, item rendered in ${appearedAfterMs} ms`,
    details,
  };
};
