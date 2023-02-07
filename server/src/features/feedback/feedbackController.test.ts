import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.random.alphaNumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

test(`POST ${ApiEndpoint.FEEDBACK} should return 422 without valid body`, async () => {
  const response = await request(server).post(ApiEndpoint.FEEDBACK);
  expect(response.status).toEqual(422);
});

test(`POST ${ApiEndpoint.FEEDBACK} should return 401 without valid authorization`, async () => {
  const response = await request(server).post(ApiEndpoint.FEEDBACK).send({
    gameId: "1234",
    feedback: "test feedback",
    username: "testuser",
  });
  expect(response.status).toEqual(401);
});
