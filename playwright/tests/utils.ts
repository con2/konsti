import { expect, APIRequestContext } from "@playwright/test";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostLoginRequest, PostLoginResponse } from "shared/types/api/login";
import { Settings } from "shared/types/models/settings";

const baseUrl = process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:5000`;

export const populateDb = async (request: APIRequestContext): Promise<void> => {
  const url = `${baseUrl}${ApiEndpoint.POPULATE_DB}`;
  const response = await request.post(url);
  expect(response.status()).toBe(200);
};

export const logTestStart = (testName: string): void => {
  console.log(`Start test: ${testName}`); // eslint-disable-line no-console
};

const postLogin = async (
  request: APIRequestContext,
  loginRequest: PostLoginRequest,
): Promise<PostLoginResponse> => {
  const url = `${baseUrl}${ApiEndpoint.LOGIN}`;
  const response = await request.post(url, {
    data: loginRequest,
  });
  expect(response.status()).toBe(200);
  const json = await response.json();
  return json;
};

export const postSettings = async (
  request: APIRequestContext,
  settings: Partial<Settings>,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username: "admin",
    password: "test",
  });
  const url = `${baseUrl}${ApiEndpoint.SETTINGS}`;
  const response = await request.post(url, {
    data: settings,
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};
