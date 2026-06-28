import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The Group tab under Profile: create, join, leave and close a group
export class GroupPage extends BasePage {
  get groupCode(): Locator {
    return this.page.getByTestId("group-code");
  }

  get createGroupButton(): Locator {
    return this.page.getByRole("button", { name: "Create group" });
  }

  async goto(): Promise<void> {
    await this.navigation.gotoProfile();
    await this.page.getByRole("link", { name: "Group" }).click();
  }

  async createGroup(): Promise<string> {
    await this.goto();
    await this.createGroupButton.click();
    await this.page
      .getByRole("button", { name: "Create", exact: true })
      .click();
    await this.groupCode.waitFor();
    const code = await this.groupCode.textContent();
    if (!code) {
      // eslint-disable-next-line no-restricted-syntax
      throw new Error("Group code was null");
    }
    return code;
  }

  async joinGroup(code: string): Promise<void> {
    await this.page.getByRole("button", { name: "Join group" }).click();
    await this.page
      .getByRole("textbox", { name: "Group creator's code" })
      .fill(code);
    await this.page.getByRole("button", { name: "Join group" }).nth(1).click();
  }

  async leaveGroup(): Promise<void> {
    await this.page.getByRole("button", { name: "Leave group" }).click();
  }

  async closeGroup(): Promise<void> {
    await this.page.getByRole("button", { name: "Close group" }).click();
  }

  async confirmCloseGroup(): Promise<void> {
    await this.page.getByRole("button", { name: "Close group" }).nth(1).click();
  }
}
