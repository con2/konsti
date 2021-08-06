import { getGames, postGamesUpdate } from "client/services/gamesServices";
import { AppThunk } from "client/typings/redux.typings";
import { submitGetGamesAsync } from "client/views/all-games/allGamesSlice";

export const submitGetGames = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getGamesResponse = await getGames();

    if (getGamesResponse?.status === "error") {
      return await Promise.reject(getGamesResponse);
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
      return await Promise.reject(gamesUpdateResponse);
    }

    if (gamesUpdateResponse?.status === "success") {
      dispatch(submitGetGames());
    }
  };
};
