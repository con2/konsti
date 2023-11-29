import { Game } from "shared/types/models/game";
import { submitUpdateFavorites } from "client/views/my-games/myGamesThunks";
import { AppDispatch } from "client/types/reduxTypes";

export interface UpdateFavoriteOpts {
  game: Game;
  action: string;
  favoritedGames: readonly Game[];
  username: string;
  dispatch: AppDispatch;
}

export const updateFavorite = async (
  updateFavoriteOpts: UpdateFavoriteOpts,
): Promise<void> => {
  const { game, action, favoritedGames, username, dispatch } =
    updateFavoriteOpts;

  if (!game.gameId) {
    return;
  }

  const gameIndex = favoritedGames.findIndex(
    (favoritedGame) => favoritedGame.gameId === game.gameId,
  );
  const favoritedGameIds = favoritedGames.map(
    (favoritedGame) => favoritedGame.gameId,
  );

  if (action === "add" && gameIndex === -1) {
    favoritedGameIds.push(game.gameId);
  } else if (action === "del" && gameIndex > -1) {
    favoritedGameIds.splice(gameIndex, 1);
  }

  try {
    await dispatch(
      submitUpdateFavorites({
        username,
        favoritedGameIds,
      }),
    );
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
    throw new Error(`submitUpdateFavorites error: ${error}`);
  }
};
