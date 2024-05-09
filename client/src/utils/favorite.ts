import { ProgramItem } from "shared/types/models/programItem";
import { submitUpdateFavorites } from "client/views/my-games/myGamesThunks";
import { AppDispatch } from "client/types/reduxTypes";

export interface UpdateFavoriteOpts {
  game: ProgramItem;
  action: string;
  favoritedProgramItems: readonly ProgramItem[];
  username: string;
  dispatch: AppDispatch;
}

export const updateFavorite = async (
  updateFavoriteOpts: UpdateFavoriteOpts,
): Promise<void> => {
  const { game, action, favoritedProgramItems, username, dispatch } =
    updateFavoriteOpts;

  if (!game.programItemId) {
    return;
  }

  const gameIndex = favoritedProgramItems.findIndex(
    (favoritedGame) => favoritedGame.programItemId === game.programItemId,
  );
  const favoritedProgramItemIds = favoritedProgramItems.map(
    (favoritedGame) => favoritedGame.programItemId,
  );

  if (action === "add" && gameIndex === -1) {
    favoritedProgramItemIds.push(game.programItemId);
  } else if (action === "del" && gameIndex > -1) {
    favoritedProgramItemIds.splice(gameIndex, 1);
  }

  try {
    await dispatch(
      submitUpdateFavorites({
        username,
        favoritedProgramItemIds,
      }),
    );
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
    throw new Error(`submitUpdateFavorites error: ${error}`);
  }
};
