import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostAssignmentRequest } from "shared/types/api/assignment";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";

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

describe(`POST ${ApiEndpoint.ASSIGNMENT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.ASSIGNMENT);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with user authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "username")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const data: Partial<PostAssignmentRequest> = {};
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(422);
  });

  test("should return 200 with admin authorization", async () => {
    const data: PostAssignmentRequest = {
      assignmentTime: dayjs().toISOString(),
    };
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
  });
});
