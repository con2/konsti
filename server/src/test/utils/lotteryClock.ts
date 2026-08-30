import { subMinutes } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";

// Nothing automatic removes a lottery sign-up once its lottery has run, so a test of any of
// those removals has to place the clock before the program item's lottery. Without this the
// clock is the real one, which is years past every fixture's start time.
export const withLotteryStillAhead = async (
  programItem: ProgramItem,
): Promise<void> => {
  await saveTestSettings({
    testTime: subMinutes(
      new Date(programItem.startTime),
      config.event().directSignupPhaseStart + 1,
    ).toISOString(),
  });
};
