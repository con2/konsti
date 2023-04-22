import { expect, test, vi } from "vitest";
import { getGroup, postCreateGroup } from "client/services/groupServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { CreateGroupRequest } from "shared/typings/api/groups";
import { api } from "client/utils/api";

test("GET group from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: "test response" });

  const groupCode = "123";
  const username = "test user";

  const response = await getGroup(groupCode, username);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP, {
    params: { groupCode, username },
  });
});

test("POST group to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const groupRequest: CreateGroupRequest = {
    groupCode: "123",
    username: "test user",
  };

  const response = await postCreateGroup(groupRequest);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP, groupRequest);
});
