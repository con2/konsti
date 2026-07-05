import { Locator } from "@playwright/test";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

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

  get signUpButton(): Locator {
    return this.root.getByRole("button", { name: "Sign up", exact: true });
  }

  get lotterySignupButton(): Locator {
    return this.root.getByRole("button", { name: /lottery sign-up/i });
  }

  async signUp(): Promise<void> {
    await this.signUpButton.click();
  }

  async lotterySignup(): Promise<void> {
    await this.lotterySignupButton.click();
  }

  async confirm(): Promise<void> {
    await this.root.getByRole("button", { name: /confirm/i }).click();
  }

  // Confirm a lottery signup and wait for the POST to be persisted, so callers can
  // mutate server state right after without racing the in-flight signup request
  async confirmLotterySignup(): Promise<void> {
    const signupResponse = this.root
      .page()
      .waitForResponse(
        (response) =>
          response.url().includes(ApiEndpoint.LOTTERY_SIGNUP) &&
          response.request().method() === "POST",
      );
    await this.confirm();
    await signupResponse;
  }

  async favorite(): Promise<void> {
    await this.root.getByTestId("add-favorite-button").click();
  }

  async showPlayers(): Promise<void> {
    await this.root.getByRole("button", { name: "Show players" }).click();
  }
}
