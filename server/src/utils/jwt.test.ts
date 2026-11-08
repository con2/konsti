import { expect, test } from "vitest";
import { UserGroup } from "shared/types/models/user";
import { getJWT, verifyJWT } from "server/utils/jwt";

test("should carry the user's id and username through a signed token", () => {
  const jwt = getJWT(UserGroup.USER, { userId: "id-1", username: "name-1" });

  const response = verifyJWT(jwt, UserGroup.USER);

  expect(response).toMatchObject({
    status: "success",
    body: { userId: "id-1", username: "name-1", userGroup: UserGroup.USER },
  });
});

test("should reject a token signed for another user group", () => {
  const jwt = getJWT(UserGroup.USER, { userId: "id-1", username: "name-1" });

  const response = verifyJWT(jwt, UserGroup.ADMIN);

  expect(response.status).toEqual("error");
});
