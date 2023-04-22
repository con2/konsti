import { expect, test, vi } from "vitest";
import {
  getUser,
  getUserBySerialOrUsername,
  postRegistration,
  updateUserPassword,
} from "client/services/userServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET user from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");
  const username = "test username";

  await getUser(username);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS, {
    params: { username },
  });
});

test("GET user by serial from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");
  const serial = "12345";

  await getUserBySerialOrUsername(serial);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME, {
    params: { searchTerm: serial },
  });
});

test("POST registration to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  const password = "test password";
  const serial = "12345";
  const username = "test username";

  const registrationFormFields = {
    password,
    serial,
    username,
    registerDescription: true,
  };

  await postRegistration(registrationFormFields);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS, {
    username,
    password,
    serial,
  });
});

test("POST new user password to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  const username = "test username";
  const password = "test password";
  const requester = "test requester";

  await updateUserPassword(username, password, requester);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS_PASSWORD, {
    username,
    password,
    requester,
  });
});
