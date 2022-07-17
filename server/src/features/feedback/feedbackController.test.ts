import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  mongoUri = mongoServer.getUri();
  server = await startServer({ dbConnString: mongoUri });
});

afterEach(async () => {
  await closeServer(server);
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
