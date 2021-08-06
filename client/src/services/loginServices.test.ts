import axios from "axios";
import { postLogin } from "client/services/loginServices";
import { LOGIN_ENDPOINT } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("POST login to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const username = "test username";
  const password = "test password";

  const loginData = {
    username,
    password,
  };

  const response = await postLogin(loginData);

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(LOGIN_ENDPOINT, {
    username,
    password,
  });
});
