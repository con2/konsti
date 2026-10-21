import { subMinutes } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";

// Positive minutes fall before the lottery sign-up closes, negative ones after it
const setClockRelativeToLotteryClose = async (
  programItem: ProgramItem,
  minutesFromClose: number,
): Promise<void> => {
  await saveTestSettings({
    testTime: subMinutes(
      new Date(programItem.startTime),
      config.event().directSignupPhaseStart + minutesFromClose,
    ).toISOString(),
  });
};

// Nothing automatic removes a lottery sign-up once its lottery has run, so a test of any of
// those removals has to place the clock before the program item's lottery. Without this the
// clock is the real one, which is years past every fixture's start time.
export const withLotteryStillAhead = async (
  programItem: ProgramItem,
): Promise<void> => {
  await setClockRelativeToLotteryClose(programItem, 1);
};

// The moment just after lottery sign-up for the program item closed, for a test of what is
// preserved once its lottery is behind it
export const withLotteryJustRun = async (
  programItem: ProgramItem,
): Promise<void> => {
  await setClockRelativeToLotteryClose(programItem, -1);
};
