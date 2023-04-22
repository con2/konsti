import { expect, test, vi } from "vitest";
import { postLogin } from "client/services/loginServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("POST login to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  const username = "test username";
  const password = "test password";

  const loginData = {
    username,
    password,
  };

  await postLogin(loginData);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.LOGIN, {
    username,
    password,
  });
});
