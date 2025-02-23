import { Server } from "node:http";
import { expect, test, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";

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

test(`POST ${ApiEndpoint.FEEDBACK} should return 401 without valid authorization`, async () => {
  const response = await request(server).post(ApiEndpoint.FEEDBACK).send();
  expect(response.status).toEqual(401);
});

test(`POST ${ApiEndpoint.FEEDBACK} should return 422 without valid body`, async () => {
  const response = await request(server)
    .post(ApiEndpoint.FEEDBACK)
    .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
  expect(response.status).toEqual(422);
});
