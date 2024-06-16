import { expect, test, vi } from "vitest";
import { postFavorite } from "client/services/favoriteServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST favorite program items to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const postFavoriteRequest = {
    username: "test username",
    favoriteProgramItemIds: [],
  };

  const response = await postFavorite(postFavoriteRequest);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.FAVORITE, postFavoriteRequest);
});
