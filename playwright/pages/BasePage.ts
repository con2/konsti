import { Locator, Page } from "@playwright/test";
import { Navigation } from "playwright/pages/Navigation";
import { NotificationBar } from "playwright/pages/NotificationBar";

// Shared base for all page objects: the #main content region plus the
// navigation drawer and notification bar reused across flows
export class BasePage {
  readonly navigation: Navigation;
  readonly notificationBar: NotificationBar;

  constructor(protected readonly page: Page) {
    this.navigation = new Navigation(page);
    this.notificationBar = new NotificationBar(page);
  }

  get main(): Locator {
    return this.page.locator("#main");
  }

  get scrollToTopButton(): Locator {
    return this.page.getByRole("button", { name: /scroll to top/i });
  }

  // The header language dropdown, present on every page
  async selectLanguage(value: "fi" | "en"): Promise<void> {
    await this.page.locator("#language").selectOption(value);
  }

  // The app-wide temporary admin message banner (set by an admin, dismissible by anyone)
  get adminMessageBanner(): Locator {
    return this.page.getByTestId("admin-message-banner");
  }

  async dismissAdminMessage(): Promise<void> {
    await this.adminMessageBanner
      .getByRole("button", { name: /close message/i })
      .click();
  }
}
