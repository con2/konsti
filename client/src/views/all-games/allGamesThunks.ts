import { getGames, postGamesUpdate } from "client/services/gamesServices";
import { AppThunk } from "client/typings/redux.typings";
import { submitGetGamesAsync } from "client/views/all-games/allGamesSlice";

export const submitGetGames = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getGamesResponse = await getGames();

    if (getGamesResponse?.status === "error") {
      // TODO
    }

    if (getGamesResponse?.status === "success") {
      dispatch(submitGetGamesAsync(getGamesResponse.games));
    }
  };
};

export const submitGamesUpdate = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const gamesUpdateResponse = await postGamesUpdate();

    if (gamesUpdateResponse?.status === "error") {
      // TODO
    }

    if (gamesUpdateResponse?.status === "success") {
      dispatch(submitGetGames());
    }
  };
};
