import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";
import { ProgramItemCard } from "playwright/pages/ProgramItemCard";

// The /program route: the All Program and My Program tabs, the program-type
// filter, search, the program-item list and the My Program sign-up lists
export class ProgramListPage extends BasePage {
  get items(): Locator {
    return this.page.locator('[data-testid="program-item-container"]');
  }

  get myProgramTab(): Locator {
    return this.page.getByTestId("my-program-tab");
  }

  get programTypeSelect(): Locator {
    return this.page.getByRole("combobox", { name: /program type/i });
  }

  get tagFilter(): Locator {
    return this.page.getByTestId("tag-filter");
  }

  async openTagFilter(): Promise<void> {
    await this.page.locator("#tagSelection").click();
  }

  async toggleTag(label: string): Promise<void> {
    await this.page.getByRole("checkbox", { name: label }).click();
  }

  async removeTag(label: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `Remove tag ${label}` })
      .click();
  }

  async clearTagFilter(): Promise<void> {
    await this.page.getByRole("button", { name: "Clear" }).click();
  }

  get lotterySignupList(): Locator {
    return this.page.getByTestId("lottery-signup-program-items-list");
  }

  get directSignupList(): Locator {
    return this.page.getByTestId("direct-signup-program-items-list");
  }

  get favoriteList(): Locator {
    return this.page.getByTestId("favorite-program-items-list");
  }

  async gotoAllProgram(): Promise<void> {
    await this.page.getByTestId("program-list-tab").click();
  }

  async gotoMyProgram(): Promise<void> {
    await this.myProgramTab.click();
  }

  async selectProgramType(label: string): Promise<void> {
    await this.programTypeSelect.selectOption(label);
  }

  async selectStartingTime(label: string): Promise<void> {
    await this.page.getByRole("radio", { name: label, exact: true }).click();
  }

  async search(text: string): Promise<void> {
    await this.page.locator("#find").fill(text);
  }

  async waitForItems(): Promise<void> {
    await this.items.first().waitFor();
  }

  firstItem(): ProgramItemCard {
    return new ProgramItemCard(this.items.nth(0));
  }

  itemByTitle(title: string): ProgramItemCard {
    return new ProgramItemCard(
      this.items.filter({
        has: this.page.getByTestId("program-item-title"),
        hasText: title,
      }),
    );
  }

  async cancelSignup(): Promise<void> {
    await this.page.getByRole("button", { name: "Cancel sign-up" }).click();
    await this.page
      .getByRole("button", { name: "Cancel your sign-up" })
      .click();
  }
}
