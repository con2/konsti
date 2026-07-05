import { test, expect, APIRequestContext } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  addProgramItems,
  postSettings,
  postTestSettings,
} from "playwright/playwrightUtils";
import { HelperPage } from "playwright/pages/HelperPage";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
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

  const programItemPage = new ProgramItemPage(page);

  await programItemPage.addSignupQuestion();
  await programItemPage.questionFinnishInput.fill("Mikä on hahmoluokkasi");
  await programItemPage.questionEnglishInput.fill(
    "What is your character class?",
  );
  await programItemPage.save();

  await expect(programItemPage.deleteSignupQuestionButton).toBeVisible();
});

test("Admin adds a multiple choice signup question to a program item", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  await login(page, request, { username: "admin", password: "test" });
  await page.goto(`/program/item/${testProgramItem.programItemId}`);

  const programItemPage = new ProgramItemPage(page);

  await programItemPage.addSignupQuestion();
  await programItemPage.questionFinnishInput.fill("Valitse hahmo");
  await programItemPage.questionEnglishInput.fill("Choose a character");

  await programItemPage.questionTypeSelect.selectOption({
    label: "Multiple choice",
  });

  await programItemPage.fillSelectOption("In Finnish", "Velho");
  await programItemPage.fillSelectOption("In English", "Wizard");

  await programItemPage.save();

  await expect(programItemPage.deleteSignupQuestionButton).toBeVisible();
});

test("Admin cancels the question form and deletes a saved question", async ({
  page,
  request,
}) => {
  await seedProgramItem(request);
  await login(page, request, { username: "admin", password: "test" });
  await page.goto(`/program/item/${testProgramItem.programItemId}`);

  const programItemPage = new ProgramItemPage(page);

  // Cancel closes the question form without saving
  await programItemPage.addSignupQuestion();
  await expect(programItemPage.questionFinnishInput).toBeVisible();
  await programItemPage.cancel();
  await expect(programItemPage.questionFinnishInput).toBeHidden();
  await expect(programItemPage.addSignupQuestionButton).toBeVisible();

  // Add a question, then delete it
  await programItemPage.addSignupQuestion();
  await programItemPage.questionFinnishInput.fill("Mikä on hahmoluokkasi");
  await programItemPage.questionEnglishInput.fill(
    "What is your character class?",
  );
  await programItemPage.save();
  await expect(programItemPage.deleteSignupQuestionButton).toBeVisible();

  await programItemPage.deleteSignupQuestionButton.click();
  await expect(programItemPage.addSignupQuestionButton).toBeVisible();
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

  const programList = new ProgramListPage(page);
  await openDirectSignup(programList);

  const programItem = programList.firstItem();
  await programItem.signUp();
  await expect(programItem.container).toContainText("What is your character?");
  await programItem.textarea().fill("Gandalf the wizard");
  await programItem.confirm();
  await expect(programItem.container).toContainText(
    "You have signed up to this",
  );

  // The answer is stored and shown back to the user in My Program
  await programList.gotoMyProgram();
  const directSignups = programList.directSignupList;
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

  const programList = new ProgramListPage(page);
  await openDirectSignup(programList);

  const programItem = programList.firstItem();
  await programItem.signUp();
  await expect(programItem.container).toContainText("Choose a character");
  await programItem.select().selectOption("Bard");
  await programItem.confirm();
  await expect(programItem.container).toContainText(
    "You have signed up to this",
  );

  await programList.gotoMyProgram();
  const directSignups = programList.directSignupList;
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

  const programList = new ProgramListPage(page);
  await openDirectSignup(programList);

  const programItem = programList.firstItem();
  await programItem.signUp();
  await expect(programItem.container).toContainText("Dietary restrictions?");
  // Private questions are flagged as organizer-only in the signup form
  await expect(programItem.container).toContainText(
    "Only visible to organizers",
  );
  await programItem.textarea().fill("No peanuts");
  await programItem.confirm();
  await expect(programItem.container).toContainText(
    "You have signed up to this",
  );

  // The user sees the question was recorded, but the answer stays organizer-only
  await programList.gotoMyProgram();
  const directSignups = programList.directSignupList;
  await expect(directSignups).toContainText("Your answer to the question");
  await expect(directSignups).toContainText("Only visible to organizers");

  // An organizer (helper) can read the private answer
  await programList.navigation.logout();
  await login(page, request, { username: "helper", password: "test" });
  await page.goto("/");

  const helperPage = new HelperPage(page);
  await helperPage.open();
  await helperPage.openSignupAnswers();
  await expect(helperPage.main).toContainText("Dietary restrictions?");
  await expect(helperPage.main).toContainText("No peanuts");
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

const openDirectSignup = async (
  programList: ProgramListPage,
): Promise<void> => {
  await programList.gotoAllProgram();
  await programList.selectProgramType("Tabletop RPG");
};
