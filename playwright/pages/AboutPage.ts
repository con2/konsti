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

  // The notice has no tab of its own, so the FAQ entry holding this link is the
  // only way into it from inside the app
  async gotoPrivacyNoticeFromFaq(): Promise<void> {
    await this.page.getByRole("link", { name: "privacy notice" }).click();
  }

  async expandFaqEntry(name: RegExp): Promise<void> {
    await this.page.getByRole("button", { name }).click();
  }
}
