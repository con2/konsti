import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { hasSignupEnded } from "server/features/user/userUtils";
import {
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
} from "shared/types/api/myProgramItems";
import {
  getDirectSignupEndTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";
import {
  delDirectSignup,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { config } from "shared/config";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { getSignupMessage } from "server/features/program-item/programItemUtils";
import { findSettings } from "server/features/settings/settingsRepository";
import { SignupType, State } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { leaveOrCloseGroup } from "server/features/user/group/groupService";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";

export const storeDirectSignup = async (
  signupRequest: PostDirectSignupRequest,
  username: string,
): Promise<PostDirectSignupResponse> => {
  const { directSignupProgramItemId } = signupRequest;

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = timeNowResult.value;

  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (!programItemResult.ok) {
    const message = `Signed program item ${directSignupProgramItemId} not found`;
    logger.warn(message);
    return {
      message,
      status: "error",
      errorId: "unknown",
    };
  }
  const programItem = programItemResult.value;

  if (
    programItem.signupType !== SignupType.KONSTI ||
    config.event().noKonstiSignupIds.includes(directSignupProgramItemId)
  ) {
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

  const settingsResult = await findSettings();
  if (!settingsResult.ok) {
    return {
      message: "Error loading settings",
      status: "error",
      errorId: "unknown",
    };
  }
  const settings = settingsResult.value;

  // Hidden program items are only filtered from the client's list view, so a
  // signup for one can still arrive from a stale page or a direct link
  if (settings.hiddenProgramItemIds.includes(directSignupProgramItemId)) {
    return {
      message: "Program item is hidden",
      status: "error",
      errorId: "hidden",
    };
  }

  const directSignupStartTime = getDirectSignupStartTime(programItem);

  if (timeNow.isBefore(directSignupStartTime)) {
    const message = `Signup for program item ${directSignupProgramItemId} not open yet, opens ${directSignupStartTime.toISOString()}`;
    logger.warn(message);
    return {
      errorId: "signupNotOpenYet",
      message,
      status: "error",
    };
  }

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const signupEnded = hasSignupEnded({
    signupEndTime: directSignupEndTime,
    timeNow,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup time ended",
      status: "error",
    };
  }

  const parentStartTime = config
    .event()
    .startTimesByParentIds.get(programItem.parentId);

  const newDirectSignup: SignupRepositoryAddSignup = {
    ...signupRequest,
    username,
    // User-made direct signups are always first-come-first-served; the priority is set
    // here rather than trusted from the request
    priority: DIRECT_SIGNUP_PRIORITY,
    // signedToStartTime can be parent-resolved; direct signups store parent time for lottery re-run cleanup
    signedToStartTime: parentStartTime ?? programItem.startTime,
    signupTime: timeNow.toISOString(),
  };

  const signupResult = await saveDirectSignup(newDirectSignup);
  if (!signupResult.ok) {
    return {
      message: "Store signup failure",
      status: "error",
      errorId: "unknown",
    };
  }
  const signup = signupResult.value;

  const signupQuestion = settings.signupQuestions.find(
    (message) => message.programItemId === programItem.programItemId,
  );

  const allSignups = {
    programItemId: signup.programItemId,
    userSignups: signup.userSignups.map((userSignup) => ({
      username: userSignup.username,
      message: getSignupMessage(signupQuestion, userSignup.message),
    })),
  };

  // Check if current user is signed in
  // If user is not included, the program item was full
  const newSignup = signup.userSignups.find(
    (userSignup) => userSignup.username === username,
  );

  if (newSignup) {
    // Group member direct signup removes them from the group, close group if group creator.
    // The signup already persisted, so a group-leave failure must not fail the request —
    // log it and still report success; the group state self-corrects on the next poll
    let leftGroup = false;
    if (isLotterySignupProgramItem(programItem)) {
      const leaveOrCloseGroupResult = await leaveOrCloseGroup(username);
      if (leaveOrCloseGroupResult.ok) {
        leftGroup = leaveOrCloseGroupResult.value;
      } else {
        logger.error(
          new Error(
            `leaveOrCloseGroup failed after direct signup for ${username}: ${leaveOrCloseGroupResult.error}`,
          ),
        );
      }
    }

    return {
      message: "Store signup success",
      status: "success",
      allSignups,
      directSignup: {
        programItemId: signup.programItemId,
        priority: newSignup.priority,
        signedToStartTime: newSignup.signedToStartTime,
        // A private signup question only hides the answer from other attendees:
        // the user's own signup keeps it so the UI can show it back to them
        message: newSignup.message,
      },
      leftGroup,
    };
  }

  return {
    message: "Program item full",
    status: "success",
    allSignups,
    leftGroup: false,
  };
};

export const removeDirectSignup = async (
  signupRequest: DeleteDirectSignupRequest,
  username: string,
): Promise<DeleteDirectSignupResponse> => {
  const { directSignupProgramItemId } = signupRequest;

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }

  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (!programItemResult.ok) {
    const message = `Signed program item ${directSignupProgramItemId} not found`;
    logger.warn(message);
    return {
      message,
      status: "error",
      errorId: "unknown",
    };
  }
  const programItem = programItemResult.value;

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const signupEnded = hasSignupEnded({
    signupEndTime: directSignupEndTime,
    timeNow: timeNowResult.value,
  });

  if (signupEnded) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const signupResult = await delDirectSignup({
    directSignupProgramItemId: signupRequest.directSignupProgramItemId,
    username,
  });
  if (!signupResult.ok) {
    return {
      message: "Delete signup failure",
      status: "error",
      errorId: "unknown",
    };
  }
  const signup = signupResult.value;

  const settingsResult = await findSettings();
  if (!settingsResult.ok) {
    return {
      message: "Error loading settings",
      status: "error",
      errorId: "unknown",
    };
  }
  const signupQuestion = settingsResult.value.signupQuestions.find(
    (message) => message.programItemId === programItem.programItemId,
  );

  return {
    message: "Delete signup success",
    status: "success",
    allSignups: {
      programItemId: signup.programItemId,
      userSignups: signup.userSignups.map((userSignup) => ({
        username: userSignup.username,
        message: getSignupMessage(signupQuestion, userSignup.message),
      })),
    },
  };
};
