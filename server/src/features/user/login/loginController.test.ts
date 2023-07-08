import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  beforeAll,
  describe,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`POST ${ApiEndpoint.LOGIN}`, () => {
  test("should return 422 without any parameters", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN);
    expect(response.status).toEqual(422);
  });

  test("should return 422 if username is found but password is missing", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN).send({
      username: "testuser",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 422 if password is found but username is missing", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN).send({
      password: "testpass",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 200 if password and username are found", async () => {
    const response = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: "testuser", password: "testpass" });
    expect(response.status).toEqual(200);
  });
});
