import { ProgramItem } from "shared/types/models/programItem";
import { submitUpdateFavorites } from "client/views/my-program-items/myProgramItemsThunks";
import { AppDispatch } from "client/types/reduxTypes";

export interface UpdateFavoriteOpts {
  programItem: ProgramItem;
  action: string;
  favoriteProgramItems: readonly ProgramItem[];
  username: string;
  dispatch: AppDispatch;
}

export const updateFavorite = async (
  updateFavoriteOpts: UpdateFavoriteOpts,
): Promise<void> => {
  const { programItem, action, favoriteProgramItems, username, dispatch } =
    updateFavoriteOpts;

  if (!programItem.programItemId) {
    return;
  }

  const programItemIndex = favoriteProgramItems.findIndex(
    (favoriteProgramItem) =>
      favoriteProgramItem.programItemId === programItem.programItemId,
  );
  const favoriteProgramItemIds = favoriteProgramItems.map(
    (favoriteProgramItem) => favoriteProgramItem.programItemId,
  );

  if (action === "add" && programItemIndex === -1) {
    favoriteProgramItemIds.push(programItem.programItemId);
  } else if (action === "del" && programItemIndex > -1) {
    favoriteProgramItemIds.splice(programItemIndex, 1);
  }

  try {
    await dispatch(
      submitUpdateFavorites({
        username,
        favoriteProgramItemIds,
      }),
    );
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/restrict-template-expressions -- TODO: Remove throw
    throw new Error(`submitUpdateFavorites error: ${error}`);
  }
};
