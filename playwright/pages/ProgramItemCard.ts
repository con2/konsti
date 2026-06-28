import { Locator } from "@playwright/test";

// A single program-item-container row in the program list, with its sign-up controls
export class ProgramItemCard {
  constructor(private readonly root: Locator) {}

  get container(): Locator {
    return this.root;
  }

  get title(): Locator {
    return this.root.getByTestId("program-item-title");
  }

  get fullMessage(): Locator {
    return this.root.getByTestId("program-item-full");
  }

  get participants(): Locator {
    return this.root.getByRole("listitem");
  }

  textarea(): Locator {
    return this.root.locator("textarea");
  }

  select(): Locator {
    return this.root.locator("select");
  }

  async signUp(): Promise<void> {
    await this.root
      .getByRole("button", { name: "Sign up", exact: true })
      .click();
  }

  async lotterySignup(): Promise<void> {
    await this.root.getByRole("button", { name: /lottery sign-up/i }).click();
  }

  async confirm(): Promise<void> {
    await this.root.getByRole("button", { name: /confirm/i }).click();
  }

  async favorite(): Promise<void> {
    await this.root.getByTestId("add-favorite-button").click();
  }

  async showPlayers(): Promise<void> {
    await this.root.getByRole("button", { name: "Show players" }).click();
  }
}
