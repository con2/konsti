import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  populateDb,
  login,
  postSettings,
  postTestSettings,
  addProgramItems,
  testPostDirectSignup,
} from "playwright/playwrightUtils";
import { ProgramItemPage } from "playwright/pages/ProgramItemPage";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";

test("Admission ticket reflects whether the user has signed up", async ({
  page,
  request,
}) => {
  const startTime = dayjs(config.event().eventStartTime)
    .add(1, "hour")
    .startOf("hour")
    .toISOString();

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      programItemId: "admission-signed-item",
      title: "Signed Up Item",
      startTime,
    },
    {
      ...testProgramItem,
      programItemId: "admission-other-item",
      title: "Not Signed Up Item",
      startTime,
    },
  ]);
  await postSettings(request, {
    signupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  });
  await postTestSettings(request, { testTime: config.event().eventStartTime });

  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: "admission-signed-item",
    message: "",
  });

  await login(page, request, { username: "test1", password: "test" });

  const programItemPage = new ProgramItemPage(page);

  // Signed-up program item shows the admission
  await page.goto("/program/item/admission-signed-item/admission");
  await expect(programItemPage.main).toContainText("Signed Up Item");
  await expect(programItemPage.main).toContainText(
    "You have signed up as user",
  );
  await expect(programItemPage.main).toContainText("test1");

  // A program item the user did not sign up to shows no admission
  await page.goto("/program/item/admission-other-item/admission");
  await expect(programItemPage.main).toContainText(
    "You have not signed up for this program item.",
  );
});
