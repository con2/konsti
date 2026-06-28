import { Locator, Page } from "@playwright/test";

// The notification bar plus the "Show all notifications" -> event log flow
export class NotificationBar {
  constructor(private readonly page: Page) {}

  get bar(): Locator {
    return this.page.getByTestId("notification-bar");
  }

  get eventLogItem(): Locator {
    return this.page.getByTestId("event-log-item");
  }

  async showAllNotifications(): Promise<void> {
    await this.page
      .getByRole("link", { name: "Show all notifications" })
      .click();
  }
}
