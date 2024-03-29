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
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: "test response" });

  const username = "test username";

  const response = await getUser(username);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS, {
    params: { username },
  });
});

test("GET user by serial from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: "test response" });

  const serial = "12345";

  const response = await getUserBySerialOrUsername(serial);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME, {
    params: { searchTerm: serial },
  });
});

test("POST registration to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const password = "test password";
  const serial = "12345";
  const username = "test username";

  const registrationFormFields = {
    password,
    serial,
    username,
    registerDescription: true,
  };

  const response = await postRegistration(registrationFormFields);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS, {
    username,
    password,
    serial,
  });
});

test("POST new user password to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const userToUpdateUsername = "test username";
  const password = "test password";

  const response = await updateUserPassword(userToUpdateUsername, password);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.USERS_PASSWORD, {
    userToUpdateUsername,
    password,
  });
});
