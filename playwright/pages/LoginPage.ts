import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The local login form and the Kompassi login entry point
export class LoginPage extends BasePage {
  get usernameInput(): Locator {
    return this.page.getByTestId("login-form-input-username");
  }

  get passwordInput(): Locator {
    return this.page.getByTestId("login-form-input-password");
  }

  get loginButton(): Locator {
    return this.page.getByTestId("login-button");
  }

  get loginToSignUpLink(): Locator {
    return this.page.getByRole("link", { name: "Log in to sign up" });
  }

  get kompassiLoginButton(): Locator {
    return this.page.getByRole("button", { name: /login or create account/i });
  }

  async fillAndSubmit(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
