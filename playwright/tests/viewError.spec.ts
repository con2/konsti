import { expect, test } from "@playwright/test";
import { addHours, startOfHour } from "date-fns";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  login,
  populateDb,
  postTestSettings,
} from "playwright/playwrightUtils";

// A program item's startTime is only validated as a string, so an unparseable
// one survives every schema and reaches the formatters, which throw on it. That
// used to unmount the whole app and leave a blank page
const seed = async (
  request: Parameters<typeof addProgramItems>[0],
): Promise<void> => {
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      startTime: "not-a-real-time",
      endTime: startOfHour(
        addHours(new Date(config.event().eventStartTime), 2),
      ).toISOString(),
    },
  ]);
  await postTestSettings(request, {
    testTime: config.event().eventStartTime,
  });
};

test("Show a recoverable error instead of a blank page when a view throws", async ({
  page,
  request,
}) => {
  await seed(request);
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();

  // The view is replaced by the fallback rather than the page going blank
  const viewError = page.getByTestId("view-error");
  await expect(viewError).toBeVisible();
  await expect(viewError).toContainText("Something went wrong");

  // The chrome outside the boundary survives, which is the point of wrapping the
  // routes rather than the whole app
  await expect(page.getByTestId("navigation-icon")).toBeVisible();
});

test("Navigating away from a thrown view recovers", async ({
  page,
  request,
}) => {
  await seed(request);
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");

  const programList = new ProgramListPage(page);
  await programList.gotoAllProgram();
  await expect(page.getByTestId("view-error")).toBeVisible();

  // An error boundary holds its failed state until reset, so without keying it
  // on the route the fallback would survive this navigation
  await programList.navigation.gotoProfile();

  await expect(page.getByTestId("view-error")).toBeHidden();
  await expect(programList.main).toContainText(/registration code/i);
});
