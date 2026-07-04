import { expect, APIRequestContext, Page } from "@playwright/test";
import { ApiDevEndpoint, ApiEndpoint } from "shared/constants/apiEndpoints";
import { localStorageStateKey } from "shared/constants/browserStorage";
import {
  PopulateDbOptions,
  PostAddSerialsResponse,
} from "shared/test-types/api/testData";
import { TestSettings } from "shared/test-types/models/testSettings";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { PostLoginRequest, PostLoginResult } from "shared/types/api/login";
import { PostDirectSignupRequest } from "shared/types/api/myProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { Settings } from "shared/types/models/settings";

// PORT_OFFSET shifts the server/API port so setup calls hit the same local
// instance the browser targets (one per git worktree). PLAYWRIGHT_BASEURL still
// wins when set (the Docker run serves client and API from http://server:5000)
const portOffset = Number(process.env.PORT_OFFSET) || 0;
const baseUrl =
  process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:${5000 + portOffset}`;

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
  programItems: ProgramItem[] = [],
): Promise<void> => {
  const url = `${baseUrl}${ApiDevEndpoint.ADD_PROGRAM_ITEMS}`;
  const response = await request.post(url, {
    data: programItems,
  });
  expect(response.status()).toBe(200);
};

export const addSerials = async (
  request: APIRequestContext,
  count: number,
): Promise<string[]> => {
  const url = `${baseUrl}${ApiDevEndpoint.ADD_SERIALS}`;
  const response = await request.post(url, {
    data: { count },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as PostAddSerialsResponse;
  expect(body.status).toBe("success");
  return body.status === "success" ? body.serials : [];
};

const postLogin = async (
  request: APIRequestContext,
  loginRequest: PostLoginRequest,
): Promise<PostLoginResult> => {
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

// Gives each login() call a unique marker key so its init script applies once
let loginCounter = 0;

export const login = async (
  page: Page,
  request: APIRequestContext,
  loginRequest: LoginRequest,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username: loginRequest.username,
    password: loginRequest.password,
  });

  loginCounter += 1;

  // Write the JWT before any app script runs on the test's own navigation.
  // The init script must apply only on the first navigation after login():
  // later ones must not resurrect the session, e.g. after a UI logout or when
  // a spec drives the login form. The marker survives logout because
  // clearSession() only removes the "state" key
  await page.addInitScript(
    ({ jwt, marker, stateKey }) => {
      if (localStorage.getItem(marker)) {
        return;
      }
      localStorage.setItem(marker, "applied");
      localStorage.setItem(
        stateKey,
        JSON.stringify({
          login: {
            jwt,
          },
        }),
      );
    },
    {
      jwt: loginResponse.jwt,
      marker: `playwright-login-${loginCounter}`,
      stateKey: localStorageStateKey,
    },
  );
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
  const body = (await response.json()) as PostAssignmentResponse;
  expect(body.status).toBe("success");
};
