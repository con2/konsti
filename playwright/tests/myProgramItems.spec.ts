import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  postSettings,
  postTestSettings,
  login,
  addProgramItems,
  populateDb,
} from "playwright/playwrightUtils";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";

const startTime = dayjs(config.event().eventStartTime)
  .add(3, "hour")
  .startOf("hour")
  .toISOString();
const endTime = dayjs(startTime)
  .add(testProgramItem.mins, "minutes")
  .toISOString();

test("Cancel lottery signup on My Program page", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programType: config.event().twoPhaseSignupProgramTypes[0],
      startTime,
      endTime,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Lottery signup to first program item
  await programList.gotoAllProgram();
  await programList.waitForItems();
  const firstProgramItem = programList.firstItem();
  await firstProgramItem.lotterySignup();
  await firstProgramItem.confirm();

  // Cancel the lottery signup on My Program page
  await programList.gotoMyProgram();
  await expect(
    programList.lotterySignupList.getByTestId("program-item-title"),
  ).toContainText("1) Test program item");

  await programList.cancelSignup();

  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups for upcoming program items. You can sign up in the All Program view.",
  );
});

test("Show empty My Program lists and toggle past program items", async ({
  page,
  request,
}) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoMyProgram();

  // Empty states for upcoming program items
  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups for upcoming program items. You can sign up in the All Program view.",
  );
  await expect(programList.directSignupList).toContainText(
    "No sign-ups for upcoming program items. You can sign up in the All Program view.",
  );
  await expect(programList.favoriteList).toContainText(
    "No upcoming favorites. You can add favorites in the All Program view.",
  );

  // Toggling past program items switches all lists to the all-time empty states
  await page
    .getByRole("button", { name: "Also show past program items" })
    .first()
    .click();

  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups. You can sign up in the All Program view.",
  );
  await expect(programList.directSignupList).toContainText(
    "No sign-ups. You can sign up in the All Program view.",
  );
  await expect(programList.favoriteList).toContainText(
    "No favorites. You can add favorites in the All Program view.",
  );

  // The starting time radios switch the lists the same way
  await programList.startingTimeOption("Last started and upcoming").click();
  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups for upcoming program items. You can sign up in the All Program view.",
  );

  await programList.startingTimeOption("All").click();
  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups. You can sign up in the All Program view.",
  );

  // The radio selection persists over a reload via sessionStorage
  await page.reload();
  await expect(programList.startingTimeOption("All")).toBeChecked();
  await expect(programList.lotterySignupList).toContainText(
    "No lottery sign-ups. You can sign up in the All Program view.",
  );
});

test("Remove favorite on My Program page", async ({ page, request }) => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime,
      endTime,
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);

  // Favorite first program item
  await programList.gotoAllProgram();
  await programList.waitForItems();
  await programList.firstItem().favorite();

  // Remove the favorite on My Program page
  await programList.gotoMyProgram();
  await expect(
    programList.favoriteList.getByTestId("program-item-title"),
  ).toContainText(testProgramItem.title);

  await programList.favoriteList
    .getByRole("button", { name: "Remove from favorites" })
    .click();

  await expect(programList.favoriteList).toContainText(
    "No upcoming favorites. You can add favorites in the All Program view.",
  );
});
