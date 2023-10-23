import { expect, test, vi } from "vitest";
import { getGroup, postCreateGroup } from "client/services/groupServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { api } from "client/utils/api";

test("GET group from server", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: "test response" });

  const groupCode = "123";

  const response = await getGroup(groupCode);

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP, {
    params: { groupCode },
  });
});

test("POST group to server", async () => {
  const spy = vi
    .spyOn(api, "post")
    .mockResolvedValue({ data: "test response" });

  const response = await postCreateGroup();

  expect(response).toEqual("test response");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(ApiEndpoint.GROUP);
});
