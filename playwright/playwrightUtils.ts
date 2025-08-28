import { expect, APIRequestContext, Page } from "@playwright/test";
import { ApiDevEndpoint, ApiEndpoint } from "shared/constants/apiEndpoints";
import { PopulateDbOptions } from "shared/test-types/api/testData";
import { TestSettings } from "shared/test-types/models/testSettings";
import { PostLoginRequest, PostLoginResponse } from "shared/types/api/login";
import { PostDirectSignupRequest } from "shared/types/api/myProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { Settings } from "shared/types/models/settings";

const baseUrl = process.env.PLAYWRIGHT_BASEURL ?? "http://localhost:5000";

export const populateDb = async (
  request: APIRequestContext,
  populateDbOptions: PopulateDbOptions,
): Promise<void> => {
  const url = `${baseUrl}${ApiDevEndpoint.POPULATE_DB}`;
  const response = await request.post(url, {
    data: populateDbOptions,
  });
  expect(response.status()).toBe(200);
};

export const clearDb = async (request: APIRequestContext): Promise<void> => {
  const url = `${baseUrl}${ApiDevEndpoint.CLEAR_DB}`;
  const response = await request.post(url);
  expect(response.status()).toBe(200);
};

export const addProgramItems = async (
  request: APIRequestContext,
  programItems: Partial<ProgramItem>[] = [],
): Promise<void> => {
  const url = `${baseUrl}${ApiDevEndpoint.ADD_PROGRAM_ITEMS}`;
  const response = await request.post(url, {
    data: programItems,
  });
  expect(response.status()).toBe(200);
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return json;
};

interface LoginRequest {
  username: string;
  password: string;
}

export const login = async (
  page: Page,
  request: APIRequestContext,
  loginRequest: LoginRequest,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username: loginRequest.username,
    password: loginRequest.password,
  });

  await page.goto("/");

  await page.evaluate((jwt) => {
    localStorage.setItem(
      "state",
      JSON.stringify({
        login: {
          jwt,
        },
      }),
    );
  }, loginResponse.jwt);
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
  const url = `${baseUrl}${ApiDevEndpoint.TEST_SETTINGS}`;
  const response = await request.post(url, {
    data: testSettings,
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};

export const testPostDirectSignup = async (
  request: APIRequestContext,
  username: string,
  directSignup: PostDirectSignupRequest,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username,
    password: "test",
  });
  const url = `${baseUrl}${ApiEndpoint.DIRECT_SIGNUP}`;
  const response = await request.post(url, {
    data: directSignup,
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};

export const postAssignment = async (
  request: APIRequestContext,
  assignmentTime: string,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username: "admin",
    password: "test",
  });
  const url = `${baseUrl}${ApiEndpoint.ASSIGNMENT}`;
  const response = await request.post(url, {
    data: { assignmentTime },
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};
