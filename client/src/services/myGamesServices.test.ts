import axios from "axios";
import { postSignedGames } from "client/services/myGamesServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("POST signed games to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const signupData = {
    username: "test username",
    selectedGames: [],
    signupTime: "2019-07-26T13:00:00Z",
  };

  const response = await postSignedGames(signupData);

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(ApiEndpoint.SIGNED_GAME, {
    signupData,
  });
});
