import axios from "axios";
import { getSettings, postSettings } from "client/services/settingsServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("GET settings from server", async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: "test response",
      })
  );

  const response = await getSettings({ includePrivateMessages: false });

  expect(response).toEqual("test response");
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(ApiEndpoint.SETTINGS);
});

test("POST setting to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const appOpen = true;

  const response = await postSettings({ appOpen });

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(ApiEndpoint.SETTINGS, {
    appOpen,
  });
});
