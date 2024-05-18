import { expect, APIRequestContext } from "@playwright/test";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PopulateDbOptions } from "shared/test-types/api/populateDb";
import { TestSettings } from "shared/test-types/models/testSettings";
import { PostLoginRequest, PostLoginResponse } from "shared/types/api/login";
import { Settings } from "shared/types/models/settings";

const baseUrl = process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:5000`;

const defaultPopulateDbOptions = {
  clean: true,
  users: true,
  programItems: true,
  lotterySignups: false,
  directSignups: false,
  eventLog: false,
};

export const populateDb = async (
  request: APIRequestContext,
  populateDbOptions: PopulateDbOptions = defaultPopulateDbOptions,
): Promise<void> => {
  const url = `${baseUrl}${ApiEndpoint.POPULATE_DB}`;
  const response = await request.post(url, {
    data: populateDbOptions,
  });
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

export const postTestSettings = async (
  request: APIRequestContext,
  testSettings: Partial<TestSettings>,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username: "admin",
    password: "test",
  });
  const url = `${baseUrl}${ApiEndpoint.TEST_SETTINGS}`;
  const response = await request.post(url, {
    data: testSettings,
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};