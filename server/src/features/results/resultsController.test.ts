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

test(`GET ${ApiEndpoint.RESULTS} should return 422 without any parameters`, async () => {
  const response = await request(server).get(ApiEndpoint.RESULTS);
  expect(response.status).toEqual(422);
});
