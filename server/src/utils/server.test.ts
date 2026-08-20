import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, expect, test } from "vitest";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(),
  });
});

afterEach(async () => {
  await closeServer(server);
});

test("should return 400 if request is not valid json", async () => {
  const response = await request(server).post("/foobar").send("notJSON");
  expect(response.status).toEqual(400);
});

test("should return 404 for unknown API path", async () => {
  const response = await request(server).get("/api/foobar");
  expect(response.status).toEqual(404);
});

test("should return 404 for a path with a file extension", async () => {
  const response = await request(server).get("/wp-login.php");
  expect(response.status).toEqual(404);
});

test("should return 404 for a dotfile path", async () => {
  const response = await request(server).get("/.env");
  expect(response.status).toEqual(404);
});

test("should return 404 for a nested path with a file extension", async () => {
  const response = await request(server).get("/wp-content/plugins/shell.php");
  expect(response.status).toEqual(404);
});
