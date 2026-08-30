import { Locator, Page, expect } from "@playwright/test";

// Helpers for driving the client's mocked clock (page.clock.install()) in
// specs that need timers to fire on demand rather than in real time

// Freeze the mocked clock so timers fire only on explicit jumps - an
// installed clock otherwise keeps advancing in real time, and slow CI steps
// could push a timed decision past the window it belongs to or fire a
// straggler timer mid-assertion. The pause target must sit safely ahead of
// the page's mocked clock (pausing into the past throws), hence the offset.
export const pauseClock = async (page: Page): Promise<void> => {
  await page.clock.pauseAt(Date.now() + 1000);
};

// Advance the mocked clock in steps until the locator is visible: fetch
// rejections settle on the real event loop between steps, so a single big
// jump could run before the failure handler has scheduled its next timer.
// Pass a longer step when what is being waited for needs a fresh poll rather
// than only a pending timer - the app drops an interval tick that arrives
// while the previous load is still in flight, so a step shorter than the
// poll interval can spend many rounds waiting for the tick after it.
export const fastForwardUntilVisible = async (
  page: Page,
  locator: Locator,
  step = "00:05",
): Promise<void> => {
  await expect(async () => {
    await page.clock.fastForward(step);
    await expect(locator).toBeVisible({ timeout: 200 });
  }).toPass({ timeout: 30_000 });
};
