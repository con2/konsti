import { Page } from "@playwright/test";

// Playwright has no page visibility emulation, so a spec that needs the app's
// hidden-page behaviour (skipped polls, the page-resume refresh) overrides
// what the document reports and fires the event the app listens to. The
// override lasts until the next navigation. While hidden the app also
// suppresses the network-error toast, so a spec failing requests in that
// state changes the toast path too
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
