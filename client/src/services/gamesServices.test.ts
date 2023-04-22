import { expect, test, vi } from "vitest";
import { getGames, postUpdateGames } from "client/services/gamesServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET games from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");

  await getGames();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GAMES);
});

test("POST games update to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  await postUpdateGames();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GAMES);
});
