import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { PostUpdateUserEmailAddressRequest } from "shared/types/api/login";
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

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

describe(`POST ${ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS)
      .send({ email: "new@example.com" });
    expect(response.status).toEqual(401);
  });

  test("should return 422 and invalidEmail errorId with invalid email format", async () => {
    const response = await request(server)
      .post(ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS)
      .send({ email: "not-an-email" })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(422);
    const body = response.body as { status: string; errorId: string };
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("invalidEmail");
  });

  test("should update the user's email address with valid input", async () => {
    await saveUser(mockUser);

    const requestBody: PostUpdateUserEmailAddressRequest = {
      email: "new@example.com",
    };
    const response = await request(server)
      .post(ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS)
      .send(requestBody)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const body = response.body as {
      status: string;
      email: string;
      emailNotificationPermitAsked: boolean;
    };
    expect(body.status).toEqual("success");
    expect(body.email).toEqual("new@example.com");
    expect(body.emailNotificationPermitAsked).toEqual(true);

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.email).toEqual("new@example.com");
    expect(user?.emailNotificationPermitAsked).toEqual(true);
  });

  test("should allow clearing the email address with an empty string", async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .post(ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS)
      .send({ email: "" })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const body = response.body as { status: string };
    expect(body.status).toEqual("success");

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.email).toEqual("");
  });
});
