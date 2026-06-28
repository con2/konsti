import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The static About / FAQ / Help content pages
export class AboutPage extends BasePage {
  heading(text: string): Locator {
    return this.page.locator("h2", { hasText: text });
  }

  async gotoHelp(): Promise<void> {
    await this.page.getByRole("link", { name: "About Konsti" }).click();
  }

  async gotoFaq(): Promise<void> {
    await this.page.getByRole("link", { name: "FAQ" }).click();
  }

  async gotoAbout(): Promise<void> {
    await this.page.getByRole("link", { name: "About", exact: true }).click();
  }
}
