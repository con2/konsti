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

  async open(): Promise<void> {
    await this.navigation.gotoHelper();
  }

  async findUser(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.getByRole("button", { name: "Find" }).click();
  }

  // Helper has two Save buttons; the password Save is the second
  async changePassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
    await this.page.getByRole("button", { name: "Save" }).nth(1).click();
  }

  async openSignupAnswers(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Sign-up question answers" })
      .click();
  }
}
