import { setTimeout as sleep } from "node:timers/promises";
import type { Browser } from "webdriverio";
import { localStorageStateKey } from "shared/constants/browserStorage";
import { frontOrigin } from "./ports.ts";
import { type Probe, removeItemServerSide } from "./testServer.ts";
import { installWitness } from "./witness.ts";

export const itemCount = async (
  browser: Browser,
  title: string,
): Promise<number> => {
  return browser.execute((wanted: string) => {
    return [
      ...document.querySelectorAll('[data-testid="program-item-title"]'),
    ].filter((element) => element.textContent.trim() === wanted).length;
  }, title);
};

// Milliseconds until the item's count on the page satisfies the condition,
// or null when it never did
const pollItemCount = async (
  browser: Browser,
  title: string,
  condition: (count: number) => boolean,
  timeoutMs: number,
): Promise<number | null> => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (condition(await itemCount(browser, title))) {
      return Date.now() - started;
    }
    await sleep(500);
  }
  return null;
};

// Milliseconds until the item rendered, or null
export const waitForItem = async (
  browser: Browser,
  title: string,
  timeoutMs: number,
): Promise<number | null> => {
  return pollItemCount(browser, title, (count) => count > 0, timeoutMs);
};

const waitForItemGone = async (
  browser: Browser,
  title: string,
  timeoutMs: number,
): Promise<void> => {
  const gone = await pollItemCount(
    browser,
    title,
    (count) => count === 0,
    timeoutMs,
  );
  if (gone !== null) {
    return;
  }
  // A probe left on the page would make the next scenario's item appear
  // before any load could have brought it
  throw new Error(`${title} still shown after the page was reset`);
};

const waitForInitialItem = async (browser: Browser): Promise<void> => {
  const shown = await waitForItem(browser, "Initial program", 30000);
  if (shown === null) {
    const url: unknown = await browser.getUrl();
    const text: unknown = await browser.execute(() => {
      return document.body.textContent.slice(0, 600);
    });
    throw new Error(
      `Initial program never rendered\nurl=${JSON.stringify(url)}\nbody=${JSON.stringify(text)}`,
    );
  }
};

// After a cross-site navigation and back, iOS 16 Safari has answered every
// command with an error object instead of a value, which switching to the
// current window handle is meant to recover from. Returns what it found,
// for the report.
export const recoverWindow = async (browser: Browser): Promise<string> => {
  try {
    const handles = await browser.getWindowHandles();
    const current = handles.at(-1);
    if (current !== undefined) {
      await browser.switchToWindow(current);
    }
    return `${handles.length} window handles`;
  } catch (error) {
    return `window recovery failed: ${String(error)}`;
  }
};

// Boot the app logged in and showing the All program list
export const bootApp = async (browser: Browser, jwt: string): Promise<void> => {
  // A session's first load through the tunnel can fail and leave Safari on
  // an error page, where the localStorage write below is refused as insecure
  for (let attempt = 0; attempt < 3; attempt++) {
    await browser.url(`${frontOrigin}/`);
    const origin: unknown = await browser.execute(() => location.origin);
    if (origin === frontOrigin) {
      break;
    }
    await sleep(2000);
  }
  await browser.execute(
    (key: string, token: string) => {
      localStorage.setItem(key, JSON.stringify({ login: { jwt: token } }));
    },
    localStorageStateKey,
    jwt,
  );
  await browser.url(`${frontOrigin}/program/list`);
  await waitForInitialItem(browser);
  await installWitness(browser);
};

// Fresh page without this session's probe, witness installed, boot load done
export const resetPage = async (
  browser: Browser,
  probe: Probe,
): Promise<void> => {
  await removeItemServerSide(probe);
  await recoverWindow(browser);
  await browser.refresh();
  await waitForInitialItem(browser);
  await waitForItemGone(browser, probe.title, 5000);
  await installWitness(browser);
  await sleep(2000);
};
