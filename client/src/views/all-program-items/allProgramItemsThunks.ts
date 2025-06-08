import {
  getProgramItems,
  postUpdateProgramItems,
} from "client/services/programItemsServices";
import { AppThunk } from "client/types/reduxTypes";
import { submitGetProgramItemsAsync } from "client/views/all-program-items/allProgramItemsSlice";

export const submitGetProgramItems = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getProgramItemsResponse = await getProgramItems();

    if (getProgramItemsResponse.status === "error") {
      return;
    }

    dispatch(submitGetProgramItemsAsync(getProgramItemsResponse.programItems));
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

    await dispatch(submitGetProgramItems());
  };
};
