import { APIRequestContext } from "@playwright/test";
import { addHours } from "date-fns";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import { addProgramItems, populateDb } from "playwright/playwrightUtils";

interface ProgramPhaseTimes {
  preWeekStart: Date;
  mainEventStart: Date;
}

// Seeds one program item from the pre-convention week and one from the main event, titled
// "Pre-week program" and "Main event program", for the specs comparing how the two are shown
export const seedProgramPhases = async (
  request: APIRequestContext,
  { preWeekStart, mainEventStart }: ProgramPhaseTimes,
): Promise<void> => {
  const programType = config.event().twoPhaseSignupProgramTypes[0];

  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    {
      ...testProgramItem,
      title: "Pre-week program",
      tags: [Tag.PRE_CONVENTION_WEEK],
      programType,
      startTime: preWeekStart.toISOString(),
      endTime: addHours(preWeekStart, 4).toISOString(),
    },
    {
      ...testProgramItem2,
      title: "Main event program",
      programType,
      startTime: mainEventStart.toISOString(),
      endTime: addHours(mainEventStart, 4).toISOString(),
    },
  ]);
};
