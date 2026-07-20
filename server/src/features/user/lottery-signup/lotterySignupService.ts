import dayjs from "dayjs";
import {
  PostLotterySignupResponse,
  DeleteLotterySignupResponse,
} from "shared/types/api/myProgramItems";
import {
  delLotterySignups,
  saveLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import {
  getLotterySignupEndTime,
  getLotterySignupStartTime,
} from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import { findUser } from "server/features/user/userRepository";
import { findSettings } from "server/features/settings/settingsRepository";
import { SignupType, State } from "shared/types/models/programItem";
import { getProgramItemValidity } from "shared/utils/getProgramItemValidity";

const validPriorities = new Set([1, 2, 3]);

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

  // Invalid program items have their signup disabled in the client, but a
  // signup can still arrive from a stale or bugged page
  if (!getProgramItemValidity(programItem).allValuesValid) {
    return {
      message: "Program item is missing required information",
      status: "error",
      errorId: "invalidProgramItem",
    };
  }

  // Hidden program items are only filtered from the client's list view, so a
  // signup for one can still arrive from a stale page or a direct link
  const settingsResult = await findSettings();
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

  if (timeNow.isBefore(lotterySignupStartTime)) {
    const message = `Signup for program item ${programItemId} not open yet, opens ${lotterySignupStartTime.toISOString()}`;
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

  // Group members don't make their own lottery signups; the group creator signs up for the group
  if (user.groupCode !== "0" && !user.isGroupCreator) {
    return {
      message: "Group member cannot create lottery signups",
      status: "error",
      errorId: "groupMember",
    };
  }

  const priorityReserved = user.lotterySignups.some(
    (lotterySignup) =>
      dayjs(lotterySignup.signedToStartTime).isSame(
        dayjs(programItem.startTime),
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
    // Lottery signups always store the item's own startTime; parent override is only used for lottery batching
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
