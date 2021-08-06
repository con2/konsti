import axios from "axios";
import { getGames, postGamesUpdate } from "client/services/gamesServices";
import { GAMES_ENDPOINT } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("GET games from server", async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: "test response",
      })
  );

  const response = await getGames();

  expect(response).toEqual("test response");
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(GAMES_ENDPOINT);
});

test("POST games update to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const response = await postGamesUpdate();

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(GAMES_ENDPOINT);
});
