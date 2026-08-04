import { Locator, Page } from "@playwright/test";

// The notification bar plus the "Show all notifications" -> event log flow
export class NotificationBar {
  static readonly testId = "notification-bar";

  constructor(private readonly page: Page) {}

  get bar(): Locator {
    return this.page.getByTestId(NotificationBar.testId);
  }

  // Marks the notification as seen, which removes the bar
  async dismiss(): Promise<void> {
    await this.bar
      .first()
      .getByRole("button", { name: "Close notification" })
      .click();
  }

  get eventLogItem(): Locator {
    return this.page.getByTestId("event-log-item");
  }

  async showAllNotifications(): Promise<void> {
    // Every unseen notification renders its own bar with this link, so click
    // the first one when several notifications are visible at once
    await this.page
      .getByRole("link", { name: "Show all notifications" })
      .first()
      .click();
  }
}
