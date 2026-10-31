import { APIRequestContext } from "@playwright/test";
import { testProgramItem2 } from "shared/tests/testProgramItem";
import { Tag } from "shared/types/models/programItem";
import {
  addProgramItems,
  populateDb,
  twoPhaseProgramItem,
} from "playwright/playwrightUtils";

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
  await populateDb(request, { clean: true, users: true, admin: true });
  await addProgramItems(request, [
    twoPhaseProgramItem(preWeekStart.toISOString(), {
      title: "Pre-week program",
      tags: [Tag.PRE_CONVENTION_WEEK],
    }),
    twoPhaseProgramItem(mainEventStart.toISOString(), {
      programItem: testProgramItem2,
      title: "Main event program",
    }),
  ]);
};
