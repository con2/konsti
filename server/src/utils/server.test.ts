import { Server } from "node:http";
import { expect, test, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { startServer, closeServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
});

test("should return 400 if request is not valid json", async () => {
  const response = await request(server).post("/foobar").send("notJSON");
  expect(response.status).toEqual(400);
});
