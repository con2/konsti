import { getUser } from "client/services/userServices";
import { postFavorite } from "client/services/favoriteServices";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitDeleteDirectSignupAsync,
  submitPostDirectSignupAsync,
  submitGetUserAsync,
  submitPostLotterySignupAsync,
  submitUpdateFavoritesAsync,
  submitDeleteLotterySignupAsync,
} from "client/views/my-program-items/myProgramItemsSlice";
import {
  DeleteDirectSignupRequest,
  DeleteLotterySignupRequest,
  PostDirectSignupRequest,
  PostLotterySignupRequest,
} from "shared/types/api/myProgramItems";
import {
  deleteDirectSignup,
  deleteLotterySignup,
  postDirectSignup,
  postLotterySignup,
} from "client/services/myProgramItemsServices";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { NewFavorite } from "shared/types/models/user";
import { submitUpdateEventLogItemsAsync } from "client/views/login/loginSlice";
import { submitUpdateGroupCodeAsync } from "client/views/group/groupSlice";
import { submitUpdateDirectSignupAsync } from "client/views/all-program-items/allProgramItemsSlice";

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
    dispatch(
      submitUpdateDirectSignupAsync({
        programItemId: signupResponse.allSignups.programItemId,
        updates: signupResponse.allSignups.userSignups.map((userSignup) => ({
          username: userSignup.username,
          signupMessage: userSignup.message,
        })),
      }),
    );
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
    dispatch(
      submitUpdateDirectSignupAsync({
        programItemId: signupResponse.allSignups.programItemId,
        updates: signupResponse.allSignups.userSignups.map((userSignup) => ({
          username: userSignup.username,
          signupMessage: userSignup.message,
        })),
      }),
    );
  };
};

export enum PostLotterySignupErrorMessage {
  SIGNUP_ENDED = "signupError.signupEnded",
  SAME_PRIORITY = "signupError.samePriority",
  PROGRAM_ITEM_NOT_FOUND = "signupError.programItemNotFound",
  SIGNUP_NOT_OPEN_YET = "signupError.signupNotOpenYet",
  UNKNOWN = "signupError.generic",
}

export const submitPostLotterySignup = (
  signupData: PostLotterySignupRequest,
): AppThunk<Promise<PostLotterySignupErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<PostLotterySignupErrorMessage | undefined> => {
    const signupResponse = await postLotterySignup(signupData);

    if (signupResponse.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostLotterySignupErrorMessage.SIGNUP_ENDED;
        case "samePriority":
          return PostLotterySignupErrorMessage.SAME_PRIORITY;
        case "invalidPriority":
          return PostLotterySignupErrorMessage.SIGNUP_NOT_OPEN_YET;
        case "programItemNotFound":
          return PostLotterySignupErrorMessage.PROGRAM_ITEM_NOT_FOUND;
        case "signupNotOpenYet":
          return PostLotterySignupErrorMessage.SIGNUP_NOT_OPEN_YET;
        case "unknown":
          return PostLotterySignupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    dispatch(submitPostLotterySignupAsync(signupResponse.lotterySignups));
  };
};

export enum DeleteLotterySignupErrorMessage {
  SIGNUP_ENDED = "signupError.signupEnded",
  UNKNOWN = "signupError.generic",
  PROGRAM_ITEM_NOT_FOUND = "signupError.programItemNotFound",
}

export const submitDeleteLotterySignup = (
  signupData: DeleteLotterySignupRequest,
): AppThunk<Promise<DeleteLotterySignupErrorMessage | undefined>> => {
  return async (
    dispatch,
  ): Promise<DeleteLotterySignupErrorMessage | undefined> => {
    const signupResponse = await deleteLotterySignup(signupData);

    if (signupResponse.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return DeleteLotterySignupErrorMessage.SIGNUP_ENDED;
        case "unknown":
          return DeleteLotterySignupErrorMessage.UNKNOWN;
        case "programItemNotFound":
          return DeleteLotterySignupErrorMessage.PROGRAM_ITEM_NOT_FOUND;
        default:
          return exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    dispatch(
      submitDeleteLotterySignupAsync(signupData.lotterySignupProgramItemId),
    );
  };
};
