import { ProgramItem } from "shared/types/models/programItem";
import { submitUpdateFavorites } from "client/views/my-program-items/myProgramItemsThunks";
import { AppDispatch } from "client/types/reduxTypes";

export interface UpdateFavoriteOpts {
  programItem: ProgramItem;
  action: string;
  favoritedProgramItems: readonly ProgramItem[];
  username: string;
  dispatch: AppDispatch;
}

export const updateFavorite = async (
  updateFavoriteOpts: UpdateFavoriteOpts,
): Promise<void> => {
  const { programItem, action, favoritedProgramItems, username, dispatch } =
    updateFavoriteOpts;

  if (!programItem.programItemId) {
    return;
  }

  const programItemIndex = favoritedProgramItems.findIndex(
    (favoritedProgramItem) =>
      favoritedProgramItem.programItemId === programItem.programItemId,
  );
  const favoritedProgramItemIds = favoritedProgramItems.map(
    (favoritedProgramItem) => favoritedProgramItem.programItemId,
  );

  if (action === "add" && programItemIndex === -1) {
    favoritedProgramItemIds.push(programItem.programItemId);
  } else if (action === "del" && programItemIndex > -1) {
    favoritedProgramItemIds.splice(programItemIndex, 1);
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
