import { Locator, Page } from "@playwright/test";

// The slide-out navigation drawer and its links, shared by every page
export class Navigation {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.getByTestId("navigation-icon").click();
  }

  async gotoLoginPage(): Promise<void> {
    await this.open();
    await this.page.getByTestId("login-page-link").click();
  }

  async gotoProfile(): Promise<void> {
    await this.open();
    await this.page.getByTestId("link-profile").click();
  }

  async gotoProgram(): Promise<void> {
    await this.open();
    await this.page.getByRole("link", { name: "Program", exact: true }).click();
  }

  async gotoAdmin(): Promise<void> {
    await this.open();
    await this.page.getByRole("link", { name: "Admin", exact: true }).click();
  }

  async gotoHelper(): Promise<void> {
    await this.open();
    await this.page.getByRole("link", { name: "Helper", exact: true }).click();
  }

  async logout(): Promise<void> {
    await this.open();
    await this.page.getByRole("link", { name: "Logout" }).click();
  }

  get loginLink(): Locator {
    return this.page.getByRole("link", { name: "Login" });
  }

  get logoutLink(): Locator {
    return this.page.getByRole("link", { name: "Logout" });
  }

  get profileLink(): Locator {
    return this.page.getByRole("link", { name: /profile/i });
  }
}
