import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";
import { FEEDBACK_ENDPOINT } from "shared/constants/apiEndpoints";

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

test(`POST ${FEEDBACK_ENDPOINT} should return 422 without valid body`, async () => {
  const response = await request(server).post(FEEDBACK_ENDPOINT);
  expect(response.status).toEqual(422);
});

test(`POST ${FEEDBACK_ENDPOINT} should return 401 without valid authorization`, async () => {
  const response = await request(server).post(FEEDBACK_ENDPOINT).send({
    gameId: "1234",
    feedback: "test feedback",
    username: "testuser",
  });
  expect(response.status).toEqual(401);
});
