import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The create-account form and the finalize-registration email step
export class RegistrationPage extends BasePage {
  get usernameInput(): Locator {
    return this.page.locator("#username");
  }

  // The registration password input has no id
  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }

  get serialInput(): Locator {
    return this.page.locator("#serial");
  }

  get descriptionCheckbox(): Locator {
    return this.page.locator("#registerDescriptionCheckbox");
  }

  get createAccountHeading(): Locator {
    return this.page.getByRole("heading", { name: "Create an account" });
  }

  get emailNotificationsEnabled(): Locator {
    return this.page.locator("#email-notifications-enabled");
  }

  get emailInput(): Locator {
    return this.page.locator("#email");
  }

  // The finalize-registration username input, shown only for Kompassi accounts
  get finalizeUsernameInput(): Locator {
    return this.page.getByTestId("login-form-input-username");
  }

  async createAccount(): Promise<void> {
    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}
