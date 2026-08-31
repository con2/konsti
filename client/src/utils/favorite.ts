import { ProgramItem } from "shared/types/models/programItem";
import { AppDispatch } from "client/types/reduxTypes";
import { submitUpdateFavorites } from "client/views/my-program-items/myProgramItemsThunks";

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

  // A failed request is already reported to the user by the request wrapper,
  // and the only error id this endpoint returns is "unknown", so there is
  // nothing here a caller could tell apart or act on
  await dispatch(
    submitUpdateFavorites({
      username,
      favoriteProgramItemIds,
    }),
  );
};
