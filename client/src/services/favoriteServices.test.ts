import { expect, test, vi } from "vitest";
import { postFavorite } from "client/services/favoriteServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST favorited games to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  const favoriteData = {
    username: "test username",
    favoritedGameIds: [],
  };

  await postFavorite(favoriteData);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.FAVORITE, favoriteData);
});
