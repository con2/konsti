import { Locator } from "@playwright/test";
import { BasePage } from "playwright/pages/BasePage";

// The public lottery results dashboard at /dashboard
export class DashboardPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/dashboard");
  }

  get title(): Locator {
    return this.main.getByRole("heading", { name: /lottery results/i });
  }

  get noResultsMessage(): Locator {
    return this.main.getByText(/no lottery results/i);
  }

  get assignmentRuns(): Locator {
    return this.main.getByTestId("assignment-run");
  }

  // The assignment time heading of the run card at the given position
  runHeading(index: number): Locator {
    return this.assignmentRuns.nth(index).getByRole("heading");
  }
}
