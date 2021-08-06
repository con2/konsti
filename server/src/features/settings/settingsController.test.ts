import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from "shared/constants/apiEndpoints";

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

describe(`POST ${TOGGLE_APP_OPEN_ENDPOINT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(TOGGLE_APP_OPEN_ENDPOINT);
    expect(response.status).toEqual(401);
  });
});
