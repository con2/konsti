import { expect, test, vi } from "vitest";
import { postSignedGames } from "client/services/myGamesServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST signed games to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const signupData = {
    username: "test username",
    selectedGames: [],
    startTime: "2019-07-26T13:00:00Z",
  };

  const response = await postSignedGames(signupData);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.SIGNED_GAME, {
    signupData,
  });
});
