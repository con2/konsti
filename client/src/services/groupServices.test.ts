import { expect, test, vi } from "vitest";
import { getGroup, postCreateGroup } from "client/services/groupServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { CreateGroupRequest } from "shared/typings/api/groups";
import { api } from "client/utils/api";

test("GET group from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue("");

  const groupCode = "123";
  const username = "test user";

  await getGroup(groupCode, username);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP, {
    params: { groupCode, username },
  });
});

test("POST group to server", async () => {
  const spy = vi.spyOn(api, "post").mockResolvedValue("");

  const groupRequest: CreateGroupRequest = {
    groupCode: "123",
    username: "test user",
  };

  await postCreateGroup(groupRequest);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP, groupRequest);
});
