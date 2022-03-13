import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { SignupStrategy } from "shared/config/sharedConfig.types";

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  mongoUri = mongoServer.getUri();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(server);
  await mongoServer.stop();
});

describe(`GET ${SETTINGS_ENDPOINT}`, () => {
  test("should return 200", async () => {
    const response = await request(server).get(SETTINGS_ENDPOINT);
    expect(response.status).toEqual(200);
  });
});

describe(`POST ${SETTINGS_ENDPOINT}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server).post(SETTINGS_ENDPOINT);
    expect(response.status).toEqual(401);
  });

  test("should return 401 without admin authorization", async () => {
    const response = await request(server)
      .post(SETTINGS_ENDPOINT)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid body", async () => {
    const response = await request(server)
      .post(SETTINGS_ENDPOINT)
      .send({ appOpen: "not boolean" })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(422);
  });

  test("should return updated settings with full or partial update", async () => {
    const testSignupMessage = { gameId: "12345", message: "Test message" };

    const testSettings = {
      hiddenGames: [],
      signupTime: "2021-07-16T14:28:01.316Z",
      appOpen: true,
      signupMessages: [testSignupMessage],
      signupStrategy: SignupStrategy.ALGORITHM,
    };

    // Full update
    const fullUpdateResponse = await request(server)
      .post(SETTINGS_ENDPOINT)
      .send(testSettings)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(fullUpdateResponse.status).toEqual(200);
    expect(fullUpdateResponse.body).toEqual({
      status: "success",
      message: "Update settings success",
      settings: testSettings,
    });

    // Partial update
    const partialUpdateResponse = await request(server)
      .post(SETTINGS_ENDPOINT)
      .send({ signupStrategy: SignupStrategy.DIRECT })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(partialUpdateResponse.status).toEqual(200);
    expect(partialUpdateResponse.body).toEqual({
      status: "success",
      message: "Update settings success",
      settings: { ...testSettings, signupStrategy: SignupStrategy.DIRECT },
    });
  });
});

describe(`POST ${HIDDEN_ENDPOINT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(HIDDEN_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});

describe(`POST ${SIGNUPTIME_ENDPOINT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(SIGNUPTIME_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
