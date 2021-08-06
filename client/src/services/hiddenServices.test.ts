import axios from "axios";
import { Game } from "shared/typings/models/game";
import { postHidden } from "client/services/hiddenServices";
import { HIDDEN_ENDPOINT } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("POST hidden games to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const hiddenData: Game[] = [];

  const response = await postHidden(hiddenData);

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(HIDDEN_ENDPOINT, {
    hiddenData,
  });
});
