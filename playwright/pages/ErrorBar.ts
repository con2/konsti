import { Locator, Page } from "@playwright/test";

// The app-wide error toast bar; a toast is dismissed by clicking it
export class ErrorBar {
  constructor(private readonly page: Page) {}

  get items(): Locator {
    return this.page.getByTestId("error-bar-item");
  }

  get networkError(): Locator {
    return this.items.filter({ hasText: /network error/i });
  }

  get apiError(): Locator {
    return this.items.filter({ hasText: /error while calling/i });
  }

  async dismissNetworkError(): Promise<void> {
    await this.networkError.click();
  }
}
