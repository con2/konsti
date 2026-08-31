import { subDays } from "date-fns";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import { saveDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  findOrCreateSettings,
  saveSettings,
} from "server/features/settings/settingsRepository";
import {
  saveUser,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { PastEventDump } from "server/test/scripts/simulate-lottery/pastEventDump";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";

export interface LoadedDump {
  programItems: readonly ProgramItem[];
  usersWithLotterySignups: number;
  lotterySignups: number;
  // Preference sets a post-run cleanup took a middle choice out of, e.g. an attendee left
  // holding priorities 1 and 3. The lost item is nowhere in the dump, so this is reported
  // rather than repaired - it is how far the replay's input is from what the run really saw.
  preferenceSetsWithHoles: number;
  directSignupsLoaded: number;
  directSignupsSkipped: number;
  // A handful of historical program items hold more sign-ups than their own maxAttendance,
  // and the write enforces the limit, so those rows do not land
  directSignupsDropped: number;
}

// A direct sign-up made after a lottery must not be fed back into it. Direct sign-up for a
// lottery program item opens only once its lottery is over, so a first-come sign-up there is
// always later than the run - and loading it would pass the item over for holding sign-ups
// and shrink the very lottery being replayed. Everything else was open all along.
const wasHeldBeforeTheLottery = (
  programItem: ProgramItem,
  lotteriedStartTimes: ReadonlySet<string>,
): boolean =>
  !isLotterySignupProgramItem(programItem) ||
  !lotteriedStartTimes.has(
    new Date(getProgramItemStartTime(programItem)).toISOString(),
  );

const countPreferenceSetsWithHoles = (dump: PastEventDump): number =>
  dump.users.reduce((holes, user) => {
    const prioritiesByStartTime = new Map<string, number[]>();
    for (const lotterySignup of user.lotterySignups) {
      const priorities =
        prioritiesByStartTime.get(lotterySignup.signedToStartTime) ?? [];
      priorities.push(lotterySignup.priority);
      prioritiesByStartTime.set(lotterySignup.signedToStartTime, priorities);
    }
    const setsWithHoles = [...prioritiesByStartTime.values()].filter(
      (priorities) => priorities.length < Math.max(...priorities),
    );
    return holes + setsWithHoles.length;
  }, 0);

interface LoadPastEventToDbParams {
  dump: PastEventDump;
  lotteriedStartTimes: ReadonlySet<string>;
}

export const loadPastEventToDb = async ({
  dump,
  lotteriedStartTimes,
}: LoadPastEventToDbParams): Promise<Result<LoadedDump, MongoDbError>> => {
  // Before the event, so saving the programme cannot decide anything the replay is about to
  // decide: nothing holds sign-ups yet, and no sign-up window has opened
  const loadTime = subDays(new Date(config.event().eventStartTime), 1);
  const testSettingsResult = await saveTestSettings({
    testTime: loadTime.toISOString(),
  });
  if (!testSettingsResult.ok) {
    return testSettingsResult;
  }

  const saveProgramItemsResult = await saveProgramItems(dump.programItems);
  if (!saveProgramItemsResult.ok) {
    return saveProgramItemsResult;
  }

  // saveUser takes no sign-ups, so the lottery sign-ups and favourites follow in one bulk
  // update. The event log is deliberately left empty: the replay writes the history each run
  // should see, where the dump's final log would hand every attendee their outcome up front.
  const users: User[] = [];
  for (const dumpUser of dump.users) {
    const saveUserResult = await saveUser({
      // Every Kompassi account in a dump carries the same redacted id, which the unique
      // index rejects. Stored as a local account instead: nothing in a replay logs in, and
      // the lottery never reads the field.
      kompassiId: "",
      username: dumpUser.username,
      serial: dumpUser.serial,
      passwordHash: dumpUser.password,
      userGroup: dumpUser.userGroup,
      groupCode: dumpUser.groupCode,
      isGroupCreator: dumpUser.isGroupCreator,
      // Redacted in the dump to the literal "<redacted>", which is not an address the schema
      // accepts. Nothing is sent either way: the replay clears the email triggers below.
      email: "",
      emailNotificationPermitAsked: dumpUser.emailNotificationPermitAsked,
    });
    if (!saveUserResult.ok) {
      return saveUserResult;
    }
    users.push({
      ...saveUserResult.value,
      favoriteProgramItemIds: dumpUser.favoriteProgramItemIds,
      lotterySignups: dumpUser.lotterySignups,
    });
  }

  const updateUsersResult = await updateUsersByUsername(users);
  if (!updateUsersResult.ok) {
    return updateUsersResult;
  }

  const programItemsById = new Map(
    dump.programItems.map((programItem) => [
      programItem.programItemId,
      programItem,
    ]),
  );

  const allDirectSignups = dump.directSignups.flatMap((directSignup) =>
    directSignup.userSignups
      .filter((userSignup) => userSignup.priority === DIRECT_SIGNUP_PRIORITY)
      .map(
        (userSignup): SignupRepositoryAddSignup => ({
          username: userSignup.username,
          directSignupProgramItemId: directSignup.programItemId,
          message: userSignup.message,
          priority: userSignup.priority,
          signedToStartTime: userSignup.signedToStartTime,
          signupTime: userSignup.signupTime,
        }),
      ),
  );

  const directSignupsToLoad = allDirectSignups.filter((directSignup) => {
    const programItem = programItemsById.get(
      directSignup.directSignupProgramItemId,
    );
    return (
      programItem !== undefined &&
      wasHeldBeforeTheLottery(programItem, lotteriedStartTimes)
    );
  });

  let directSignupsDropped = 0;
  if (directSignupsToLoad.length > 0) {
    const saveDirectSignupsResult = await saveDirectSignups(
      directSignupsToLoad,
      dump.programItems,
    );
    if (!saveDirectSignupsResult.ok) {
      return saveDirectSignupsResult;
    }
    directSignupsDropped = saveDirectSignupsResult.value.droppedSignups.length;
  }

  // The lottery reads no settings, but the notification step reads the email triggers and the
  // replay must not queue mail for attendees whose event is years past
  const settingsResult = await findOrCreateSettings();
  if (!settingsResult.ok) {
    return settingsResult;
  }
  const saveSettingsResult = await saveSettings({
    emailNotificationTrigger: [],
  });
  if (!saveSettingsResult.ok) {
    return saveSettingsResult;
  }

  return makeSuccessResult({
    programItems: dump.programItems,
    usersWithLotterySignups: dump.users.filter(
      (user) => user.lotterySignups.length > 0,
    ).length,
    lotterySignups: dump.users.reduce(
      (total, user) => total + user.lotterySignups.length,
      0,
    ),
    preferenceSetsWithHoles: countPreferenceSetsWithHoles(dump),
    directSignupsLoaded: directSignupsToLoad.length - directSignupsDropped,
    directSignupsSkipped: allDirectSignups.length - directSignupsToLoad.length,
    directSignupsDropped,
  });
};
