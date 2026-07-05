import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The single program-item detail page (/program/item/*): hide control and
// the admin sign-up question editor
export class ProgramItemPage extends BasePage {
  get title(): Locator {
    return this.page.getByTestId("program-item-title");
  }

  get titleLink(): Locator {
    return this.title.getByRole("link");
  }

  get backLink(): Locator {
    return this.page.getByRole("link", { name: "Back" });
  }

  // The details row showing the program item's start and end time
  get timeRow(): Locator {
    return this.page
      .getByRole("heading", { name: "Time", exact: true })
      .locator("..");
  }

  get deleteSignupQuestionButton(): Locator {
    return this.page.getByRole("button", { name: "Delete sign-up question" });
  }

  get questionFinnishInput(): Locator {
    return this.page.getByPlaceholder("In Finnish");
  }

  get questionEnglishInput(): Locator {
    return this.page.getByPlaceholder("In English");
  }

  get questionTypeSelect(): Locator {
    return this.page.locator('select:has(option:has-text("Multiple choice"))');
  }

  // The select-option inputs have no labels, so scope via the form's headings
  get questionForm(): Locator {
    return this.page.getByText("Add additional info field").locator("..");
  }

  // Exact name: a bare /hide program item/i would also match the
  // "Unhide program item" button
  get hideButton(): Locator {
    return this.page.getByRole("button", { name: "Hide program item" });
  }

  get showButton(): Locator {
    return this.page.getByRole("button", { name: "Unhide program item" });
  }

  get addSignupQuestionButton(): Locator {
    return this.page.getByRole("button", { name: "Add sign-up question" });
  }

  async hide(): Promise<void> {
    await this.hideButton.click();
  }

  async show(): Promise<void> {
    await this.showButton.click();
  }

  async goBack(): Promise<void> {
    await this.backLink.click();
  }

  async addSignupQuestion(): Promise<void> {
    await this.addSignupQuestionButton.click();
  }

  async cancel(): Promise<void> {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }

  async fillSelectOption(
    heading: "In Finnish" | "In English",
    value: string,
  ): Promise<void> {
    await this.questionForm
      .getByText(heading, { exact: true })
      .locator("..")
      .locator("input")
      .first()
      .fill(value);
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}
