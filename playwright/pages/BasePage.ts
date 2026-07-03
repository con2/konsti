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
}
