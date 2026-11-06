import { setTimeout as sleep } from "node:timers/promises";
import { ApiDevEndpoint, ApiEndpoint } from "shared/constants/apiEndpoints";
import { PopulateDbOptions } from "shared/test-types/api/testData";
import { PostTestSettingsRequest } from "shared/test-types/api/testSettings";
import {
  hoursIntoEvent,
  signupsOpenTime,
  twoPhaseProgramItem,
} from "shared/tests/programItemFixtures";
import { testProgramItem2 } from "shared/tests/testProgramItem";
import { PostLoginRequest, PostLoginResponse } from "shared/types/api/login";
import { ProgramItem } from "shared/types/models/programItem";
import { apiPort, frontPort } from "./ports.ts";

const apiUrl = `http://127.0.0.1:${apiPort}`;

// Both program items start an hour into the event so they are upcoming at
// the moment direct sign-up opens, which the check runs at
const testTime = signupsOpenTime();
const itemStartTime = hoursIntoEvent(1);
const initialItem = twoPhaseProgramItem(itemStartTime, {
  title: "Initial program",
});

// The program item one session adds while its page cannot see it. Sessions
// run in parallel against the one test server, so each has its own.
export interface Probe {
  title: string;
  programItem: ProgramItem;
}

export const createProbe = (key: string): Probe => {
  const title = `Added program ${key}`;
  return {
    title,
    programItem: twoPhaseProgramItem(itemStartTime, {
      programItem: {
        ...testProgramItem2,
        programItemId: `added-${key}`,
        parentId: `added-${key}`,
      },
      title,
    }),
  };
};

const api = async <T = unknown>(
  endpoint: string,
  body?: unknown,
  jwt?: string,
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }
  const request = {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
  // The test server runs under a file watcher and is unreachable for a few
  // seconds while it restarts, so a refused connection is retried before it
  // is reported as the server being gone
  let response: Response | undefined;
  for (let attempt = 0; attempt < 15 && response === undefined; attempt++) {
    try {
      response = await fetch(`${apiUrl}${endpoint}`, request);
    } catch (error) {
      // Only a refused connection proves the request never reached the
      // server; anything else may have applied the write already
      if (
        !(error instanceof Error) ||
        (error.cause as { code?: string } | undefined)?.code !== "ECONNREFUSED"
      ) {
        throw error;
      }
      await sleep(1000);
    }
  }
  if (response === undefined) {
    throw new Error(
      `The test server at ${apiUrl} stopped answering, check yarn server:test`,
    );
  }
  const text = await response.text();
  if (response.status !== 200) {
    throw new Error(`${endpoint} -> ${response.status} ${text}`);
  }
  // The test endpoints answer a plain "OK"
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};

const login = async (loginRequest: PostLoginRequest): Promise<string> => {
  const body = await api<PostLoginResponse>(ApiEndpoint.LOGIN, loginRequest);
  if (body.status !== "success") {
    throw new Error(
      `Login failed for ${loginRequest.username}: ${JSON.stringify(body)}`,
    );
  }
  return body.jwt;
};

const addProgramItems = async (programItems: ProgramItem[]): Promise<void> => {
  await api(ApiDevEndpoint.ADD_PROGRAM_ITEMS, programItems);
};

// Resets the database to one program item and returns test1's JWT. Run once
// per run, before any session starts.
export const seed = async (): Promise<string> => {
  const populateDbOptions: PopulateDbOptions = {
    clean: true,
    users: true,
    admin: true,
  };
  await api(ApiDevEndpoint.POPULATE_DB, populateDbOptions);
  await addProgramItems([initialItem]);
  const adminJwt = await login({ username: "admin", password: "test" });
  const testSettings: PostTestSettingsRequest = { testTime };
  await api(ApiDevEndpoint.TEST_SETTINGS, testSettings, adminJwt);
  return login({ username: "test1", password: "test" });
};

// The test endpoint replaces the whole program, so every write posts every
// session's live probe, and writes are queued so a slower request cannot land
// after a newer one and drop another session's probe
const liveProbes = new Map<string, ProgramItem>();
let previousWrite: Promise<void> = Promise.resolve();

const writeProgram = async (): Promise<void> => {
  const waitFor = previousWrite;
  const { promise, resolve: finish }: PromiseWithResolvers<void> =
    Promise.withResolvers();
  previousWrite = promise;
  try {
    await waitFor;
    await addProgramItems([initialItem, ...liveProbes.values()]);
  } finally {
    finish();
  }
};

export const addItemServerSide = async (probe: Probe): Promise<void> => {
  liveProbes.set(probe.programItem.programItemId, probe.programItem);
  await writeProgram();
};

export const removeItemServerSide = async (probe: Probe): Promise<void> => {
  liveProbes.delete(probe.programItem.programItemId);
  await writeProgram();
};

// Both local servers must answer before any device minutes are spent, and a
// missing one should be named rather than surface as a failed fetch
export const checkLocalServers = async (): Promise<void> => {
  const servers = [
    { url: `${apiUrl}${ApiEndpoint.HEALTH}`, start: "yarn server:test" },
    { url: `http://127.0.0.1:${frontPort}/`, start: "yarn browserstack:front" },
  ];
  for (const server of servers) {
    let answers: boolean;
    try {
      answers = (await fetch(server.url)).ok;
    } catch {
      answers = false;
    }
    if (!answers) {
      throw new Error(`Nothing answers at ${server.url}, run ${server.start}`);
    }
  }
};
