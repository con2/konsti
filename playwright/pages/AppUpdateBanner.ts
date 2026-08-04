import { Locator, Page } from "@playwright/test";

// The banner shown when the server reports a newer app version than the one
// the page is running
export class AppUpdateBanner {
  static readonly testId = "app-update-banner";

  constructor(private readonly page: Page) {}

  get container(): Locator {
    return this.page.getByTestId(AppUpdateBanner.testId);
  }

  get reloadButton(): Locator {
    return this.container.getByRole("button", { name: "Reload", exact: true });
  }

  get dismissButton(): Locator {
    return this.container.getByRole("button", {
      name: "Close update notification",
    });
  }
}
