import { isEqual, isSameMinute } from "date-fns";
import { MongoDbError } from "shared/types/api/errors";
import {
  DeleteLotterySignupResponse,
  PostLotterySignupResponse,
} from "shared/types/api/myProgramItems";
import {
  ProgramItem,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { getProgramItemValidity } from "shared/utils/getProgramItemValidity";
import { Result, makeSuccessResult } from "shared/utils/result";
import {
  getLotterySignupEndTime,
  getLotterySignupStartTime,
  getProgramItemStartTime,
} from "shared/utils/signupTimes";
import { isSameOrAfter } from "shared/utils/timeComparison";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { findUserDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  findProgramItemById,
  findProgramItems,
} from "server/features/program-item/programItemRepository";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import {
  delLotterySignups,
  saveLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser } from "server/features/user/userRepository";
import { hasSignupEnded } from "server/features/user/userUtils";
import { logger } from "server/utils/logger";

const validPriorities = new Set([1, 2, 3]);

// Whether the user already holds a spot in a program item starting at the same time as this one.
// Matched program item to program item rather than against the sign-up's stored signedToStartTime,
// so the answer agrees with the assignment, which settles attendees by the item's current time
const holdsSpotAtStartTime = async (
  username: string,
  programItem: ProgramItem,
): Promise<Result<boolean, MongoDbError>> => {
  const userDirectSignupsResult = await findUserDirectSignups(username);
  if (!userDirectSignupsResult.ok) {
    return userDirectSignupsResult;
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }

  const startTime = getProgramItemStartTime(programItem);

  // The documents hold every attendee's sign-ups, so narrow to this user's first
  const holdsSpot = userDirectSignupsResult.value
    .filter((directSignup) =>
      directSignup.userSignups.some(
        (userSignup) => userSignup.username === username,
      ),
    )
    .some((directSignup) => {
      const signedProgramItem = programItemsResult.value.find(
        (found) => found.programItemId === directSignup.programItemId,
      );
      if (!signedProgramItem) {
        return false;
      }
      return isSameMinute(
        new Date(getProgramItemStartTime(signedProgramItem)),
        new Date(startTime),
      );
    });

  return makeSuccessResult(holdsSpot);
};

interface StoreLotterySignupParams {
  programItemId: string;
  priority: number;
  username: string;
}

export const storeLotterySignup = async ({
  programItemId,
  priority,
  username,
}: StoreLotterySignupParams): Promise<PostLotterySignupResponse> => {
  if (!validPriorities.has(priority)) {
    return {
      errorId: "invalidPriority",
      message: `Invalid priority: ${priority}`,
      status: "error",
    };
  }

  const programItemResult = await findProgramItemById(programItemId);
  if (!programItemResult.ok) {
    return {
      message: `Program item not found: ${programItemId}`,
      status: "error",
      errorId: "programItemNotFound",
    };
  }
  const programItem = programItemResult.value;

  if (programItem.signupType !== SignupType.KONSTI) {
    return {
      message: "No Konsti signup for this program item",
      status: "error",
      errorId: "noKonstiSignup",
    };
  }

  if (programItem.state === State.CANCELLED) {
    return {
      message: "Program item is cancelled",
      status: "error",
      errorId: "cancelled",
    };
  }

  // Invalid program items have their sign-up disabled in the client, but a
  // sign-up can still arrive from a stale or bugged page
  if (!getProgramItemValidity(programItem).allValuesValid) {
    return {
      message: "Program item is missing required information",
      status: "error",
      errorId: "invalidProgramItem",
    };
  }

  // Hidden program items are only filtered from the client's list view, so a
  // sign-up for one can still arrive from a stale page or a direct link
  const settingsResult = await findOrCreateSettings();
  if (!settingsResult.ok) {
    return {
      message: "Error loading settings",
      status: "error",
      errorId: "unknown",
    };
  }
  if (settingsResult.value.hiddenProgramItemIds.includes(programItemId)) {
    return {
      message: "Program item is hidden",
      status: "error",
      errorId: "hidden",
    };
  }

  // A program item is lotteried at most once. Moving it onto a later slot reopens the window
  // these times are derived from, so without this a sign-up could be made to an item no run
  // will ever consider again
  if (
    programItem.lotteryRanForStartTime !== undefined &&
    !isSameMinute(
      new Date(programItem.lotteryRanForStartTime),
      new Date(getProgramItemStartTime(programItem)),
    )
  ) {
    return {
      message: `Lottery for program item ${programItemId} has already been run`,
      status: "error",
      errorId: "lotteryAlreadyRun",
    };
  }

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = timeNowResult.value;

  const lotterySignupStartTime = getLotterySignupStartTime(programItem);

  if (!isSameOrAfter(timeNow, lotterySignupStartTime)) {
    // String rather than toISOString, which throws on an unparseable date - the
    // very case this branch exists to report
    const message = `Signup for program item ${programItemId} not open yet, opens ${String(lotterySignupStartTime)}`;
    logger.warn(message);
    return {
      errorId: "signupNotOpenYet",
      message,
      status: "error",
    };
  }

  const lotterySignupEndTime = getLotterySignupEndTime(programItem);
  const signupEnded = hasSignupEnded({
    signupEndTime: lotterySignupEndTime,
    timeNow,
  });
  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: `Signup for program item ${programItemId} has ended at ${lotterySignupEndTime.toISOString()}`,
      status: "error",
    };
  }

  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }
  const user = userResult.value;
  if (!user) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }

  // Group members don't make their own lottery sign-ups; the group creator signs up for the group
  if (user.groupCode !== "0" && !user.isGroupCreator) {
    return {
      message: "Group member cannot create lottery signups",
      status: "error",
      errorId: "groupMember",
    };
  }

  // The lottery only gives spots to attendees who don't have one, so a sign-up made while
  // already holding a spot at this start time could never be acted on
  const holdsSpotResult = await holdsSpotAtStartTime(username, programItem);
  if (!holdsSpotResult.ok) {
    return {
      message: "Error finding existing signups",
      status: "error",
      errorId: "unknown",
    };
  }
  if (holdsSpotResult.value) {
    return {
      message: `User already has a direct signup for the start time of program item ${programItemId}`,
      status: "error",
      errorId: "directSignupForSlot",
    };
  }

  const priorityReserved = user.lotterySignups.some(
    (lotterySignup) =>
      isEqual(
        new Date(lotterySignup.signedToStartTime),
        new Date(programItem.startTime),
      ) && lotterySignup.priority === priority,
  );

  if (priorityReserved) {
    return {
      message: "Duplicate priority score found",
      status: "error",
      errorId: "samePriority",
    };
  }

  const lotterySignup = {
    programItemId,
    priority,
    // Lottery sign-ups always store the item's own startTime; parent override is only used for lottery batching
    signedToStartTime: programItem.startTime,
  };

  const responseResult = await saveLotterySignup({
    lotterySignup,
    username,
  });

  if (!responseResult.ok) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Lottery signup success",
    status: "success",
    lotterySignups: responseResult.value.lotterySignups,
  };
};

export const removeLotterySignup = async (
  lotterySignupProgramItemId: string,
  username: string,
): Promise<DeleteLotterySignupResponse> => {
  const programItemResult = await findProgramItemById(
    lotterySignupProgramItemId,
  );
  if (!programItemResult.ok) {
    return {
      message: `Program item not found: ${lotterySignupProgramItemId}`,
      status: "error",
      errorId: "programItemNotFound",
    };
  }
  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }

  const lotterySignupEndTime = getLotterySignupEndTime(programItemResult.value);

  const signupEnded = hasSignupEnded({
    signupEndTime: lotterySignupEndTime,
    timeNow: timeNowResult.value,
  });
  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: `Signup for program item ${lotterySignupProgramItemId} has ended at ${lotterySignupEndTime.toISOString()}`,
      status: "error",
    };
  }

  const responseResult = await delLotterySignups([
    {
      lotterySignupProgramItemIds: [lotterySignupProgramItemId],
      username,
    },
  ]);

  if (!responseResult.ok) {
    return {
      message: "Removing lottery signup failed",
      status: "error",
      errorId: "unknown",
    };
  }

  return { message: "Lottery signup remove success", status: "success" };
};
