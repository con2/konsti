import { expect, test } from "@playwright/test";
import { testProgramItem } from "shared/tests/testProgramItem";
import { ProgramListPage } from "playwright/pages/ProgramListPage";
import {
  addProgramItems,
  hoursIntoEvent,
  login,
  populateDb,
  postTestSettings,
  testPostDirectSignup,
} from "playwright/playwrightUtils";

// The formatters read the active language from module state, which React cannot
// see. A component that formats a time it did not get from the clock hook has no
// other reason to re-render on a switch, so its weekday used to stay in the
// language it was first rendered in while the text around it changed.
test("Formatted times follow a language switch", async ({ page, request }) => {
  const startTime = hoursIntoEvent(3);
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [{ ...testProgramItem, startTime }]);
  await postTestSettings(request, { testTime: startTime });
  await testPostDirectSignup(request, "test1", {
    directSignupProgramItemId: testProgramItem.programItemId,
    message: "",
  });
  await login(page, request, { username: "test1", password: "test" });

  await page.goto("/");
  const programList = new ProgramListPage(page);

  // The sign-up group heading, formatted from the sign-up's own start time
  await expect(programList.main).toContainText(/friday/i);

  await programList.selectLanguage("fi");

  await expect(programList.main).toContainText(/perjantai/i);
  await expect(programList.main).not.toContainText(/friday/i);
});
