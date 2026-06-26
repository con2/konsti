import { test, expect, Page, APIRequestContext } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import { LoginProvider } from "shared/config/eventConfigTypes";

test("Admin adds a text signup question to a program item", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  await login(page, request, { username: "admin", password: "test" });
  await page.goto(`/program/item/${testProgramItem.programItemId}`);

  await page.getByRole("button", { name: "Add sign-up question" }).click();
  await page.getByPlaceholder("In Finnish").fill("Mikä on hahmoluokkasi");
  await page
    .getByPlaceholder("In English")
    .fill("What is your character class?");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByRole("button", { name: "Delete sign-up question" }),
  ).toBeVisible();
});

test("Admin adds a multiple choice signup question to a program item", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  await login(page, request, { username: "admin", password: "test" });
  await page.goto(`/program/item/${testProgramItem.programItemId}`);

  await page.getByRole("button", { name: "Add sign-up question" }).click();
  await page.getByPlaceholder("In Finnish").fill("Valitse hahmo");
  await page.getByPlaceholder("In English").fill("Choose a character");

  await page
    .locator('select:has(option:has-text("Multiple choice"))')
    .selectOption({ label: "Multiple choice" });

  // The select-option inputs have no labels, so scope via the form's section headings
  const questionForm = page
    .getByText("Add additional info field")
    .locator("..");
  await questionForm
    .getByText("In Finnish", { exact: true })
    .locator("..")
    .locator("input")
    .first()
    .fill("Velho");
  await questionForm
    .getByText("In English", { exact: true })
    .locator("..")
    .locator("input")
    .first()
    .fill("Wizard");

  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByRole("button", { name: "Delete sign-up question" }),
  ).toBeVisible();
});

test("User answers a public text signup question on direct signup", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  const signupQuestion: SignupQuestion = {
    programItemId: testProgramItem.programItemId,
    questionFi: "Mika on hahmosi?",
    questionEn: "What is your character?",
    private: false,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  };
  await postSettings(request, { signupQuestions: [signupQuestion] });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await openDirectSignup(page);

  const programItem = page
    .locator('[data-testid="program-item-container"]')
    .nth(0);
  await programItem
    .getByRole("button", { name: "Sign up", exact: true })
    .click();
  await expect(programItem).toContainText("What is your character?");
  await programItem.locator("textarea").fill("Gandalf the wizard");
  await programItem.getByRole("button", { name: "Confirm" }).click();
  await expect(programItem).toContainText("You have signed up to this");

  // The answer is stored and shown back to the user in My Program
  await page.click("data-testid=my-program-tab");
  const directSignups = page.getByTestId("direct-signup-program-items-list");
  await expect(directSignups).toContainText("Your answer to the question");
  await expect(directSignups).toContainText("Gandalf the wizard");
});

test("User answers a public multiple choice signup question on direct signup", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  const signupQuestion: SignupQuestion = {
    programItemId: testProgramItem.programItemId,
    questionFi: "Valitse hahmo",
    questionEn: "Choose a character",
    private: false,
    type: SignupQuestionType.SELECT,
    selectOptions: [
      { optionFi: "Velho", optionEn: "Wizard" },
      { optionFi: "Bardi", optionEn: "Bard" },
    ],
  };
  await postSettings(request, { signupQuestions: [signupQuestion] });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await openDirectSignup(page);

  const programItem = page
    .locator('[data-testid="program-item-container"]')
    .nth(0);
  await programItem
    .getByRole("button", { name: "Sign up", exact: true })
    .click();
  await expect(programItem).toContainText("Choose a character");
  await programItem.locator("select").selectOption("Bard");
  await programItem.getByRole("button", { name: "Confirm" }).click();
  await expect(programItem).toContainText("You have signed up to this");

  await page.click("data-testid=my-program-tab");
  const directSignups = page.getByTestId("direct-signup-program-items-list");
  await expect(directSignups).toContainText("Your answer to the question");
  await expect(directSignups).toContainText("Bard");
});

test("User answers a private signup question on direct signup", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  const signupQuestion: SignupQuestion = {
    programItemId: testProgramItem.programItemId,
    questionFi: "Erityisruokavalio?",
    questionEn: "Dietary restrictions?",
    private: true,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  };
  await postSettings(request, {
    loginProvider: LoginProvider.LOCAL,
    signupQuestions: [signupQuestion],
  });
  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");
  await openDirectSignup(page);

  const programItem = page
    .locator('[data-testid="program-item-container"]')
    .nth(0);
  await programItem
    .getByRole("button", { name: "Sign up", exact: true })
    .click();
  await expect(programItem).toContainText("Dietary restrictions?");
  // Private questions are flagged as organizer-only in the signup form
  await expect(programItem).toContainText("Only visible to organizers");
  await programItem.locator("textarea").fill("No peanuts");
  await programItem.getByRole("button", { name: "Confirm" }).click();
  await expect(programItem).toContainText("You have signed up to this");

  // The user sees the question was recorded, but the answer stays organizer-only
  await page.click("data-testid=my-program-tab");
  const directSignups = page.getByTestId("direct-signup-program-items-list");
  await expect(directSignups).toContainText("Your answer to the question");
  await expect(directSignups).toContainText("Only visible to organizers");

  // An organizer (helper) can read the private answer
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Logout" }).click();
  await login(page, request, { username: "helper", password: "test" });
  await page.goto("/");
  await page.getByTestId("navigation-icon").click();
  await page.getByRole("link", { name: "Helper", exact: true }).click();
  await page.getByRole("button", { name: "Sign-up question answers" }).click();
  await expect(page.locator("#main")).toContainText("Dietary restrictions?");
  await expect(page.locator("#main")).toContainText("No peanuts");
});

const seedProgramItem = async (request: APIRequestContext): Promise<void> => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: dayjs(config.event().eventStartTime)
        .add(1, "hour")
        .startOf("hour")
        .toISOString(),
    },
  ]);
  await postTestSettings(request, { testTime: config.event().eventStartTime });
};

const openDirectSignup = async (page: Page): Promise<void> => {
  await page.click("data-testid=program-list-tab");
  await page
    .getByRole("combobox", { name: /program type/i })
    .selectOption("Tabletop RPG");
};
