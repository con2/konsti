import type { Browser } from "webdriverio";

const safariBundleId = "com.apple.mobilesafari";

// BrowserStack's iOS Safari sessions allow only a subset of the mobile:
// commands (not lock or backgroundApp), so backgrounding is the home button
// plus activateApp, and the screen is turned off and on with the power
// button as an IO HID event
export const pressHome = async (browser: Browser): Promise<void> => {
  await browser.execute("mobile: pressButton", { name: "home" });
};
export const pressPower = async (browser: Browser): Promise<void> => {
  await browser.execute("mobile: performIoHidEvent", {
    page: 0x0c,
    usage: 0x30,
    durationSeconds: 0.2,
  });
};
export const foregroundSafari = async (browser: Browser): Promise<void> => {
  await browser.execute("mobile: activateApp", { bundleId: safariBundleId });
};
export const safariState = async (browser: Browser): Promise<unknown> => {
  return browser.execute("mobile: queryAppState", { bundleId: safariBundleId });
};

// The session's status on the Automate dashboard, set once per session from
// every scenario that ran in it, through BrowserStack's executor command
export const setSessionStatus = async (
  browser: Browser,
  failures: string[],
  // Scenarios skipped as UNCLEAR: not a failure, but the session must not
  // read as having verified a path it never exercised
  skipped: string[],
): Promise<void> => {
  const status = failures.length > 0 ? "failed" : "passed";
  const parts = [
    ...(failures.length > 0 ? [`failed: ${failures.join("; ")}`] : []),
    ...(skipped.length > 0 ? [`not exercised: ${skipped.join("; ")}`] : []),
  ];
  const reason = parts.length > 0 ? parts.join(". ") : "all scenarios passed";
  await browser.execute(
    `browserstack_executor: ${JSON.stringify({
      action: "setSessionStatus",
      arguments: { status, reason },
    })}`,
  );
};
