import { setTimeout as sleep } from "node:timers/promises";
import { type TestContext, afterAll, describe, inject, it } from "vitest";
import { type Browser, remote } from "webdriverio";
import {
  foregroundSafari,
  pressHome,
  pressPower,
  safariState,
  setSessionStatus,
} from "../utils/device.ts";
import {
  bootApp,
  itemCount,
  recoverWindow,
  resetPage,
  waitForItem,
} from "../utils/page.ts";
import {
  type Probe,
  addItemServerSide,
  createProbe,
} from "../utils/testServer.ts";
import {
  type Outcome,
  observeAfter,
  resumeOutcome,
  verbose,
} from "../utils/verdict.ts";
import { deviceNow, readWitness } from "../utils/witness.ts";

// A skipped scenario means Safari reloaded the page or did not restore it
// from the bfcache, so it did not exercise the path it is there for

const devices = [
  { deviceName: "iPhone 16", osVersion: "18" },
  { deviceName: "iPhone 14", osVersion: "16" },
];

// Each device runs two sessions of two scenarios each, all four sessions at
// once, so a run takes as long as its slowest pair. Screen off is last in its
// session because the unlock is the least certain step on a remote device.
const scenarioGroups = [
  ["2", "3"],
  ["4", "1"],
];

const deviceFilter = process.env.BROWSERSTACK_DEVICE;
const scenarioFilter = process.env.BROWSERSTACK_SCENARIOS?.split(",");

// A scenario runs unless the scenario filter is set and leaves it out
const selected = (number: string): boolean => {
  return scenarioFilter === undefined || scenarioFilter.includes(number);
};

type Scenario = (
  context: TestContext,
  browser: Browser,
  probe: Probe,
) => Promise<void>;

const conclude = (context: TestContext, outcome: Outcome): void => {
  console.log(`  ${outcome.verdict}, ${outcome.summary}`);
  if (verbose) {
    console.log(`  ${JSON.stringify(outcome.details)}`);
  }
  if (outcome.verdict === "UNCLEAR") {
    context.skip(outcome.summary);
  }
  context.expect(outcome).toMatchObject({ verdict: "PASS" });
};

const scenarios: Record<string, { title: string; run: Scenario }> = {
  // Safari backgrounded past a poll: the hidden-tab path
  "2": {
    title: "2 backgrounded 90 s loads once on foregrounding",
    run: async (context, browser, probe) => {
      await addItemServerSide(probe);
      const before = await deviceNow(browser);
      await pressHome(browser);
      await sleep(2000);
      const stateWhileAway = await safariState(browser);
      await sleep(88000);
      await foregroundSafari(browser);
      conclude(
        context,
        resumeOutcome(await observeAfter(browser, probe, before, 15000), {
          stateWhileAway,
        }),
      );
    },
  },

  // Backgrounded briefly: no load on foregrounding, the next tick delivers
  "3": {
    title: "3 backgrounded 10 s does not load on foregrounding",
    run: async (context, browser, probe) => {
      await addItemServerSide(probe);
      const before = await deviceNow(browser);
      await pressHome(browser);
      await sleep(10000);
      await foregroundSafari(browser);
      await sleep(3000);
      const witness = await readWitness(browser);
      const loadsWithin3s =
        witness.loads?.filter((at) => at > before).length ?? null;
      const itemWithin3s = await itemCount(browser, probe.title);
      const appeared = await waitForItem(browser, probe.title, 75000);
      const after = await readWitness(browser);
      const details = {
        loadsWithin3s,
        itemWithin3s,
        loadsTotal: after.loads?.filter((at) => at > before).length ?? null,
        itemAppearedAfterMs: appeared,
        events: witness.events
          ?.filter((event) => event.at > before)
          .map((event) => ({ ...event, at: event.at - before })),
      };
      // A page that never went hidden would pass for nothing
      const wasHidden =
        witness.events?.some((event) => {
          return event.at > before && event.visibility === "hidden";
        }) ?? false;
      if (loadsWithin3s === null) {
        conclude(context, {
          verdict: "UNCLEAR",
          summary: "the page reloaded, so nothing could be observed",
          details,
        });
      } else if (!wasHidden) {
        conclude(context, {
          verdict: "UNCLEAR",
          summary: "the page never went hidden, so Safari was not backgrounded",
          details,
        });
      } else if (loadsWithin3s > 0 || itemWithin3s > 0) {
        conclude(context, {
          verdict: "FAIL",
          summary: `${loadsWithin3s} loads and the item ${itemWithin3s > 0 ? "shown" : "not shown"} within 3 s of showing (expected neither)`,
          details,
        });
      } else if (appeared === null) {
        conclude(context, {
          verdict: "FAIL",
          summary:
            "no load on showing, but the next tick never delivered the item",
          details,
        });
      } else {
        conclude(context, {
          verdict: "PASS",
          summary: `no load within 3 s of showing, the tick delivered the item after ${Math.round(appeared / 1000)} s`,
          details,
        });
      }
    },
  },

  // Navigated away and back past a poll: the bfcache pageshow path
  "4": {
    title: "4 navigate away 90 s and back loads once on the restore",
    run: async (context, browser, probe) => {
      await addItemServerSide(probe);
      const before = await deviceNow(browser);
      await browser.url("https://example.com/");
      await sleep(90000);
      await browser.back();
      await sleep(1000);
      const window = await recoverWindow(browser);
      const url: unknown = await browser.getUrl();
      const observation = await observeAfter(browser, probe, before, 20000);
      const outcome = resumeOutcome(observation, { window, url });
      if (outcome.verdict === "PASS" && !observation.restored) {
        conclude(context, {
          ...outcome,
          verdict: "UNCLEAR",
          summary: `Safari did not restore the page from the bfcache, ${outcome.summary}`,
        });
        return;
      }
      conclude(context, {
        ...outcome,
        summary: observation.restored
          ? `bfcache restore, ${outcome.summary}`
          : outcome.summary,
      });
    },
  },

  // Screen off past a poll, then wake and unlock: the frozen-page path
  "1": {
    title: "1 screen off 90 s loads once on waking",
    run: async (context, browser, probe) => {
      await addItemServerSide(probe);
      const before = await deviceNow(browser);
      await pressPower(browser);
      await sleep(90000);
      await pressPower(browser);
      await sleep(1500);
      await pressHome(browser);
      await sleep(1500);
      await foregroundSafari(browser);
      conclude(
        context,
        resumeOutcome(await observeAfter(browser, probe, before, 15000)),
      );
    },
  },
};

interface Session {
  label: string;
  device: { deviceName: string; osVersion: string };
  scenarioNumbers: string[];
  probe: Probe;
  browser?: Promise<Browser>;
  // Settles when the session's previous scenario is done; a session has one
  // phone, so its scenarios take turns even though the tests run at once
  turn: Promise<void>;
  failures: string[];
  skipped: string[];
  // Set when a reset failed, so the session's next scenario does not run on a
  // page in an unknown state
  brokenBy?: string;
}

const sessions: Session[] = devices
  .filter((device) => {
    return !deviceFilter || device.deviceName.includes(deviceFilter);
  })
  .flatMap((device) => {
    return scenarioGroups.map((group) => {
      const scenarioNumbers = group.filter(selected);
      const label = `${device.deviceName} iOS ${device.osVersion}, scenarios ${scenarioNumbers.join(" and ")}`;
      return {
        label,
        device,
        scenarioNumbers,
        probe: createProbe(
          `${device.deviceName.replaceAll(" ", "")}-${group.join("")}`,
        ),
        turn: Promise.resolve(),
        failures: [],
        skipped: [],
      };
    });
  })
  .filter((session) => session.scenarioNumbers.length > 0);

const openSession = (session: Session): Promise<Browser> => {
  session.browser ??= (async () => {
    const { user, key, localIdentifier, jwt } = inject("browserstack");
    const browser = await remote({
      protocol: "https",
      hostname: "hub-cloud.browserstack.com",
      port: 443,
      path: "/wd/hub",
      user,
      key,
      logLevel: "warn",
      connectionRetryTimeout: 180000,
      capabilities: {
        browserName: "Safari",
        "bstack:options": {
          deviceName: session.device.deviceName,
          osVersion: session.device.osVersion,
          realMobile: true,
          // BrowserStack ends a session after 90 s without a command by
          // default, which the 90 s absences sit right on; 300 s is its maximum
          idleTimeout: 300,
          local: true,
          localIdentifier,
          projectName: "Konsti",
          buildName: process.env.BROWSERSTACK_BUILD ?? "Safari page resume",
          sessionName: session.label,
        },
      },
    });
    console.log(`${session.label}, session ${browser.sessionId}`);
    try {
      await bootApp(browser, jwt);
    } catch (error) {
      // An open session holds one of the account's parallel slots until it
      // idles out; a failing delete must not hide why the boot failed
      try {
        await browser.deleteSession();
      } catch (deleteError) {
        console.error("Deleting the session failed", deleteError);
      }
      throw error;
    }
    return browser;
  })();
  return session.browser;
};

// Queues the scenario behind whichever of its session's scenarios started
// before it. Taken when the test runs, not when it is declared, so a scenario
// a -t filter or a .only leaves out holds nobody up.
const inSession = (
  session: Session,
  number: string,
): ((context: TestContext) => Promise<void>) => {
  return async (context) => {
    const previousTurn = session.turn;
    const { promise, resolve: endTurn }: PromiseWithResolvers<void> =
      Promise.withResolvers();
    session.turn = promise;
    context.onTestFailed(() => {
      session.failures.push(scenarios[number].title);
    });
    context.onTestFinished(() => {
      if (context.task.result?.state === "skip") {
        session.skipped.push(scenarios[number].title);
      }
    });
    try {
      await previousTurn;
      if (session.brokenBy !== undefined) {
        throw new Error(
          `The session's previous reset failed: ${session.brokenBy}`,
        );
      }
      const browser = await openSession(session);
      try {
        await scenarios[number].run(context, browser, session.probe);
      } finally {
        // A failing reset must not replace this scenario's own result, the
        // failed expectation or the skip; it breaks the next scenario instead
        try {
          await resetPage(browser, session.probe);
        } catch (error) {
          session.brokenBy =
            error instanceof Error ? error.message : String(error);
        }
      }
    } finally {
      endTurn();
    }
  };
};

describe.concurrent("Safari page resume", () => {
  for (const session of sessions) {
    for (const number of session.scenarioNumbers) {
      it(
        `${scenarios[number].title} on ${session.device.deviceName} iOS ${session.device.osVersion}`,
        inSession(session, number),
      );
    }
  }

  // One session per pair of scenarios, so its dashboard status covers both
  afterAll(async () => {
    await Promise.all(
      sessions.map(async (session) => {
        if (session.browser === undefined) {
          return;
        }
        let browser: Browser;
        try {
          browser = await session.browser;
        } catch {
          // A session that failed to open already failed its tests
          return;
        }
        // A broken session fails both calls; each is logged so neither error
        // hides the other or the remaining sessions' cleanup
        for (const step of [
          async () => {
            await setSessionStatus(browser, session.failures, session.skipped);
          },
          async () => {
            await browser.deleteSession();
          },
        ]) {
          try {
            await step();
          } catch (error) {
            console.error(`${session.label}: cleanup failed`, error);
          }
        }
      }),
    );
  });
});
