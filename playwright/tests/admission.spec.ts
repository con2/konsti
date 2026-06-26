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
    priority: 0,
  });

  await login(page, request, { username: "test1", password: "test" });
  await page.goto("/");

  // Signed-up program item shows the admission
  await page.goto("/program/item/admission-signed-item/admission");
  await expect(page.locator("#main")).toContainText("Signed Up Item");
  await expect(page.locator("#main")).toContainText(
    "You have signed up as user",
  );
  await expect(page.locator("#main")).toContainText("test1");

  // A program item the user did not sign up to shows no admission
  await page.goto("/program/item/admission-other-item/admission");
  await expect(page.locator("#main")).toContainText(
    "You have not signed up for this program item.",
  );
});
