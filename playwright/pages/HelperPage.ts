import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The helper tools: find a user, reset their password, read private answers
export class HelperPage extends BasePage {
  get searchInput(): Locator {
    return this.page.getByPlaceholder("Registration code or username");
  }

  get newPasswordInput(): Locator {
    return this.page.getByPlaceholder("New password");
  }

  // Email notification settings act on the logged-in user's own account, so the helper
  // flow (managing another user) must not show them
  get emailInput(): Locator {
    return this.page.locator("#email");
  }

  async open(): Promise<void> {
    await this.navigation.gotoHelper();
  }

  async findUser(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.getByRole("button", { name: "Find" }).click();
  }

  // The helper flow only manages the password, so there is a single Save button
  async changePassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async openSignupAnswers(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Sign-up question answers" })
      .click();
  }
}
