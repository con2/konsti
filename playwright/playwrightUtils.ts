import { APIRequestContext, Page, expect } from "@playwright/test";
import { addHours, isAfter, startOfHour, subMinutes } from "date-fns";
import { config } from "shared/config";
import { ApiDevEndpoint, ApiEndpoint } from "shared/constants/apiEndpoints";
import { localStorageStateKey } from "shared/constants/browserStorage";
import {
  PopulateDbOptions,
  PostAddSerialsResponse,
} from "shared/test-types/api/testData";
import { GetTestSettingsResponse } from "shared/test-types/api/testSettings";
import { TestSettings } from "shared/test-types/models/testSettings";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import {
  PostLoginRequest,
  PostLoginResponse,
  PostLoginResult,
} from "shared/types/api/login";
import {
  PostDirectSignupRequest,
  PostLotterySignupRequest,
} from "shared/types/api/myProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import { Settings } from "shared/types/models/settings";
import { resolvePortOffset } from "scripts/portOffset";

// The per-worktree port offset shifts the server/API port so setup calls hit
// the same local instance the browser targets. PLAYWRIGHT_BASEURL still wins
// when set (the Docker run serves client and API from http://server:5000).
const portOffset = resolvePortOffset();
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
  // The server responds 200 with an error body on failed login, so the status
  // code alone doesn't prove the login succeeded
  const body = (await response.json()) as PostLoginResponse;
  expect(body.status).toBe("success");
  if (body.status !== "success") {
    // Unreachable after the expect above; narrows the union for the return type
    // eslint-disable-next-line no-restricted-syntax
    throw new Error(`Login failed for user ${loginRequest.username}`);
  }
  return body;
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
  // clearSession() only removes the "state" key.
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

export const testPostLotterySignup = async (
  request: APIRequestContext,
  username: string,
  lotterySignup: PostLotterySignupRequest,
): Promise<void> => {
  const loginResponse = await postLogin(request, {
    username,
    password: "test",
  });
  const url = `${baseUrl}${ApiEndpoint.LOTTERY_SIGNUP}`;
  const response = await request.post(url, {
    data: lotterySignup,
    headers: { Authorization: `Bearer ${loginResponse.jwt}` },
  });
  expect(response.status()).toBe(200);
};

const getTestTime = async (
  request: APIRequestContext,
): Promise<string | null> => {
  const url = `${baseUrl}${ApiDevEndpoint.TEST_SETTINGS}`;
  const response = await request.get(url);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as GetTestSettingsResponse;
  expect(body.status).toBe("success");
  if (body.status !== "success") {
    // Unreachable after the expect above; narrows the union for the return type
    // eslint-disable-next-line no-restricted-syntax
    throw new Error("Could not read the test settings");
  }
  return body.testSettings.testTime;
};

// The server runs a lottery only inside its own window - once lottery sign-up for that starting
// time closes, before direct sign-up opens - so the clock goes to the moment it closes for the
// run and back afterwards, leaving the test on whatever time it set for itself
export const postAssignment = async (
  request: APIRequestContext,
  assignmentTime: string,
): Promise<void> => {
  const testTimeBefore = await getTestTime(request);
  await postTestSettings(request, {
    testTime: subMinutes(
      new Date(assignmentTime),
      config.event().directSignupPhaseStart,
    ).toISOString(),
  });

  try {
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
  } finally {
    // Put the clock back even when the run is refused, so one failure doesn't leave every
    // later test in the file running at the lottery's moment
    await postTestSettings(request, { testTime: testTimeBefore });
  }
};

// The app update banner reports an update when the server's build time is
// newer than the one baked into the client bundle (0 in development and ci
// builds). The test server reports none, so patch the settings responses to
// simulate a deploy. Defaults to a time after the client's, i.e. a newer
// server; pass a lower one to play an instance that hasn't rolled yet, or null
// to drop the field as a server too old to send it would. Returns a setter so
// a test can simulate a further deploy mid-run.
export const reportServerBuildTime = async (
  page: Page,
  buildTime: string | null = "1000",
): Promise<(nextBuildTime: string) => void> => {
  let reportedBuildTime = buildTime;
  await page.route("**/api/settings", async (route) => {
    try {
      const response = await route.fetch();
      const json = (await response.json()) as { appBuildTime?: string };
      if (reportedBuildTime === null) {
        delete json.appBuildTime;
      } else {
        json.appBuildTime = reportedBuildTime;
      }
      await route.fulfill({ response, json });
    } catch {
      // Fail the request rather than leaving it hanging until the client's
      // own timeout, which would look like an outage to the app. Aborting
      // throws too once the context is gone, which is the expected case here:
      // the mocked clock can leave a poll in flight when the test ends, and
      // closing the context disposes the response mid-read.
      try {
        await route.abort();
      } catch {
        // Context already closed, nothing left to answer
      }
    }
  });
  return (nextBuildTime: string): void => {
    reportedBuildTime = nextBuildTime;
  };
};

// The moment the suite treats as the start of the event: every spec's mocked
// clock and every program item start time is built from this. It is the event
// start unless the event holds direct sign-up back past it, because a spec
// starting its clock before sign-ups open has nothing to sign up to.
export const signupsOpenTime = (): string => {
  const { eventStartTime, rollingDirectSignupEarliestStartTime } =
    config.event();

  return rollingDirectSignupEarliestStartTime &&
    isAfter(
      new Date(rollingDirectSignupEarliestStartTime),
      new Date(eventStartTime),
    )
    ? rollingDirectSignupEarliestStartTime
    : eventStartTime;
};

// Program item start times, built relative to the event start so a spec never
// pins an absolute date. Truncated to a whole hour because lottery items are
// only valid on one, and the hour is the event's own: the config pins this
// process to that timezone.
export const hoursIntoEvent = (hours: number): string =>
  startOfHour(addHours(new Date(signupsOpenTime()), hours)).toISOString();
