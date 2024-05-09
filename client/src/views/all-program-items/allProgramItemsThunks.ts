import {
  getGames,
  postUpdateGames,
} from "client/services/programItemsServices";
import { AppThunk } from "client/types/reduxTypes";
import { submitGetProgramItemsAsync } from "client/views/all-program-items/allProgramItemsSlice";

export const submitGetGames = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getGamesResponse = await getGames();

    if (getGamesResponse.status === "error") {
      // TODO
    }

    if (getGamesResponse.status === "success") {
      dispatch(submitGetProgramItemsAsync(getGamesResponse.programItems));
    }
  };
};

export const submitUpdateGames = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const gamesUpdateResponse = await postUpdateGames();

    if (gamesUpdateResponse.status === "error") {
      // TODO
    }

    if (gamesUpdateResponse.status === "success") {
      dispatch(submitGetGames());
    }
  };
};
