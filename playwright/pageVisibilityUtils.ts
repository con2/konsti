import { Page } from "@playwright/test";

// Playwright has no page visibility emulation, so a spec overrides what the
// document reports and fires the event the app listens to, the same way the
// unit tests' helper does, until the next navigation
export const setPageHidden = async (
  page: Page,
  hidden: boolean,
): Promise<void> => {
  await page.evaluate((isHidden) => {
    Object.defineProperties(document, {
      hidden: { value: isHidden, configurable: true },
      visibilityState: {
        value: isHidden ? "hidden" : "visible",
        configurable: true,
      },
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
};
