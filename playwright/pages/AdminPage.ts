import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The admin console: open/close the app, signup strategy and assignment runs
export class AdminPage extends BasePage {
  get openKonstiButton(): Locator {
    return this.page.getByRole("button", { name: "Open Konsti" });
  }

  get closeKonstiButton(): Locator {
    return this.page.getByRole("button", { name: "Close Konsti" });
  }

  get assignmentResult(): Locator {
    return this.page.getByText(/Assignment Result/);
  }

  get signupStrategySelect(): Locator {
    return this.page.locator('select:has(option:has-text("Lottery + Direct"))');
  }

  get adminMessageFiInput(): Locator {
    return this.page.getByLabel(/in finnish/i);
  }

  get adminMessageEnInput(): Locator {
    return this.page.getByLabel(/in english/i);
  }

  get saveAdminMessageButton(): Locator {
    return this.page.getByRole("button", { name: "Save message" });
  }

  get clearAdminMessageButton(): Locator {
    return this.page.getByRole("button", { name: "Clear message" });
  }

  async open(): Promise<void> {
    await this.navigation.gotoAdmin();
  }

  async openKonsti(): Promise<void> {
    await this.openKonstiButton.click();
  }

  async closeKonsti(): Promise<void> {
    await this.closeKonstiButton.click();
  }

  async assignAttendees(): Promise<void> {
    await this.page.getByRole("button", { name: "Assign attendees" }).click();
  }

  async selectSignupStrategy(label: string): Promise<void> {
    await this.signupStrategySelect.selectOption({ label });
  }
}
