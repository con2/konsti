import { Locator, Page } from "@playwright/test";
import { ErrorBar } from "playwright/pages/ErrorBar";
import { Navigation } from "playwright/pages/Navigation";
import { NotificationBar } from "playwright/pages/NotificationBar";

// Shared base for all page objects: the #main content region plus the
// navigation drawer, notification bar, and error toast bar reused across flows
export class BasePage {
  readonly navigation: Navigation;
  readonly notificationBar: NotificationBar;
  readonly errorBar: ErrorBar;

  constructor(protected readonly page: Page) {
    this.navigation = new Navigation(page);
    this.notificationBar = new NotificationBar(page);
    this.errorBar = new ErrorBar(page);
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

  // The registration code notice shown below the header on a user's first login
  get firstLoginNotice(): Locator {
    return this.page.getByTestId("first-login-notice");
  }

  async closeFirstLoginNotice(): Promise<void> {
    await this.firstLoginNotice.getByRole("button", { name: "Close" }).click();
  }

  async dismissAdminMessage(): Promise<void> {
    await this.adminMessageBanner
      .getByRole("button", { name: /close message/i })
      .click();
  }
}
