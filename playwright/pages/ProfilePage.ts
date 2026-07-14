import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The profile view: email notification settings, password change, and the
// Kompassi first-login profile completion form
export class ProfilePage extends BasePage {
  get emailInput(): Locator {
    return this.page.locator("#email");
  }

  get emailNotificationsEnabled(): Locator {
    return this.page.locator("#email-notifications-enabled");
  }

  get emailNotificationsDisabled(): Locator {
    return this.page.locator("#email-notifications-disabled");
  }

  get newPasswordInput(): Locator {
    return this.page.getByPlaceholder("New password");
  }

  // Reused by the Kompassi profile completion form
  get usernameInput(): Locator {
    return this.page.getByTestId("login-form-input-username");
  }

  get privacyNoticeCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /privacy notice/i });
  }

  // Profile has two Save buttons: email is first, password is second
  async saveEmail(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).nth(0).click();
  }

  async savePassword(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).nth(1).click();
  }

  // The Kompassi completion form has a single Save button
  async save(): Promise<void> {
    await this.page.getByRole("button", { name: /save/i }).click();
  }
}
