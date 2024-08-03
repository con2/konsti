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
      // TODO
    }

    if (getProgramItemsResponse.status === "success") {
      dispatch(
        submitGetProgramItemsAsync(getProgramItemsResponse.programItems),
      );
    }
  };
};

export const submitUpdateProgramItems = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const programItemsUpdateResponse = await postUpdateProgramItems();

    if (programItemsUpdateResponse.status === "error") {
      // TODO
    }

    if (programItemsUpdateResponse.status === "success") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(submitGetProgramItems());
    }
  };
};
