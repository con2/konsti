import { Locator, Page } from "@playwright/test";

// The app-wide error toast bar; a toast is dismissed with its close button
export class ErrorBar {
  static readonly testId = "error-bar-item";

  constructor(private readonly page: Page) {}

  get items(): Locator {
    return this.page.getByTestId(ErrorBar.testId);
  }

  get networkError(): Locator {
    return this.items.filter({ hasText: /network error/i });
  }

  get apiError(): Locator {
    return this.items.filter({ hasText: /error while calling/i });
  }

  // Shown when a stored session is rejected and the app signs the user out
  get sessionExpired(): Locator {
    return this.items.filter({ hasText: /session has expired/i });
  }

  async dismissNetworkError(): Promise<void> {
    await this.networkError
      .getByRole("button", { name: /close error/i })
      .click();
  }
}
