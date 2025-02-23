import { getUser } from "client/services/userServices";
import { postFavorite } from "client/services/favoriteServices";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitDeleteDirectSignupAsync,
  submitPostDirectSignupAsync,
  submitGetUserAsync,
  submitPostLotterySignupsAsync,
  submitUpdateFavoritesAsync,
} from "client/views/my-program-items/myProgramItemsSlice";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupRequest,
  PostLotterySignupsRequest,
} from "shared/types/api/myProgramItems";
import {
  deleteDirectSignup,
  postDirectSignup,
  postLotterySignups,
} from "client/services/myProgramItemsServices";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { NewFavorite } from "shared/types/models/user";
import { submitUpdateEventLogItemsAsync } from "client/views/login/loginSlice";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";

export const submitGetUser = (username: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getUserResponse = await getUser(username);

    if (getUserResponse.status === "error") {
      // TODO
    }

    if (getUserResponse.status === "success") {
      const directSignups = getUserResponse.programItems.directSignups;
      const favoriteProgramItemIds =
        getUserResponse.programItems.favoriteProgramItemIds;
      const lotterySignups = getUserResponse.programItems.lotterySignups;
      const eventLogItems = getUserResponse.eventLogItems;

      dispatch(
        submitGetUserAsync({
          directSignups,
          favoriteProgramItemIds,
          lotterySignups,
        }),
      );

      dispatch(submitUpdateEventLogItemsAsync(eventLogItems));

      dispatch(
        submitUpdateGroupCodeAsync({
          groupCode: getUserResponse.groupCode,
          isGroupCreator: getUserResponse.groupCreatorCode !== "0",
        }),
      );
    }
  };
};

export const submitUpdateFavorites = (newFavorite: NewFavorite): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateFavoriteResponse = await postFavorite(newFavorite);

    if (updateFavoriteResponse.status === "error") {
      // TODO
    }

    if (updateFavoriteResponse.status === "success") {
      dispatch(
        submitUpdateFavoritesAsync(
          updateFavoriteResponse.favoriteProgramItemIds,
        ),
      );
    }
  };
};

export enum PostDirectSignupErrorMessage {
  PROGRAM_ITEM_FULL = "signupError.programItemFull",
  UNKNOWN = "signupError.generic",
  SIGNUP_ENDED = "signupError.signupEnded",
  SIGNUP_NOT_OPEN_YET = "signupError.signupNotOpenYet",
  NO_KONSTI_SIGNUP = "signupError.noKonstiSignup",
}

export const submitPostDirectSignup = (
  data: PostDirectSignupRequest,
): AppThunk<Promise<PostDirectSignupErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<PostDirectSignupErrorMessage | undefined> => {
    const signupResponse = await postDirectSignup(data);

    if (signupResponse.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostDirectSignupErrorMessage.SIGNUP_ENDED;
        case "programItemFull":
          return PostDirectSignupErrorMessage.PROGRAM_ITEM_FULL;
        case "signupNotOpenYet":
          return PostDirectSignupErrorMessage.SIGNUP_NOT_OPEN_YET;
        case "noKonstiSignup":
          return PostDirectSignupErrorMessage.NO_KONSTI_SIGNUP;
        case "unknown":
          return PostDirectSignupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    dispatch(submitPostDirectSignupAsync(signupResponse.directSignup));
  };
};

export enum DeleteDirectSignupErrorMessage {
  UNKNOWN = "signupError.cancelFailed",
  SIGNUP_ENDED = "signupError.signupEnded",
}

export const submitDeleteDirectSignup = (
  data: DeleteDirectSignupRequest,
): AppThunk<Promise<DeleteDirectSignupErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<DeleteDirectSignupErrorMessage | undefined> => {
    const signupResponse = await deleteDirectSignup(data);

    if (signupResponse.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return DeleteDirectSignupErrorMessage.SIGNUP_ENDED;
        case "unknown":
          return DeleteDirectSignupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    dispatch(submitDeleteDirectSignupAsync(data.directSignupProgramItemId));
  };
};

export enum PostLotterySignupsErrorMessage {
  SIGNUP_ENDED = "signupError.signupEnded",
  SAME_PRIORITY = "signupError.samePriority",
  UNKNOWN = "signupError.generic",
}

export const submitPostLotterySignups = (
  signupData: PostLotterySignupsRequest,
): AppThunk<Promise<PostLotterySignupsErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<PostLotterySignupsErrorMessage | undefined> => {
    const signupResponse = await postLotterySignups(signupData);

    if (signupResponse.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostLotterySignupsErrorMessage.SIGNUP_ENDED;
        case "samePriority":
          return PostLotterySignupsErrorMessage.SAME_PRIORITY;
        case "unknown":
          return PostLotterySignupsErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    dispatch(submitPostLotterySignupsAsync(signupResponse.lotterySignups));
  };
};
