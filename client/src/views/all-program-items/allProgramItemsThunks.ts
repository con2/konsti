import { isDeepEqual } from "remeda";
import {
  getProgramItems,
  postUpdateProgramItems,
} from "client/services/programItemsServices";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitGetDirectSignupsAsync,
  submitGetProgramItemsAsync,
} from "client/views/all-program-items/allProgramItemsSlice";

export const submitGetProgramItems = ({
  forceUpdate,
}: {
  forceUpdate: boolean;
}): AppThunk<Promise<boolean>> => {
  return async (dispatch, getState): Promise<boolean> => {
    const getProgramItemsResponse = await getProgramItems();

    if (getProgramItemsResponse.status === "error") {
      return false;
    }

    const state = getState();

    const programItems = getProgramItemsResponse.programItems.map(
      (programItemWithAttendees) => programItemWithAttendees.programItem,
    );

    if (
      forceUpdate ||
      !isDeepEqual(state.allProgramItems.programItems, programItems)
    ) {
      dispatch(submitGetProgramItemsAsync(programItems));
    }

    const directSignups = getProgramItemsResponse.programItems.map(
      (programItemWithAttendees) => {
        return {
          users: programItemWithAttendees.users,
          programItemId: programItemWithAttendees.programItem.programItemId,
        };
      },
    );

    if (
      forceUpdate ||
      !isDeepEqual(state.allProgramItems.directSignups, directSignups)
    ) {
      dispatch(submitGetDirectSignupsAsync(directSignups));
    }

    return true;
  };
};

export const submitUpdateProgramItems = (): AppThunk<
  Promise<string | undefined>
> => {
  return async (dispatch): Promise<string | undefined> => {
    const programItemsUpdateResponse = await postUpdateProgramItems();

    if (programItemsUpdateResponse.status === "error") {
      return programItemsUpdateResponse.message;
    }

    await dispatch(submitGetProgramItems({ forceUpdate: false }));
  };
};
