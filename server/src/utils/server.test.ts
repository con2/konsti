import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";

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

test("should return 400 if request is not valid json", async () => {
  const response = await request(server).post("/foobar").send("notJSON");
  expect(response.status).toEqual(400);
});
