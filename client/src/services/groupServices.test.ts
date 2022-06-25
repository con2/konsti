import axios from "axios";
import { getGroup, postCreateGroup } from "client/services/groupServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { CreateGroupRequest } from "shared/typings/api/groups";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("GET group from server", async () => {
  mockAxios.get.mockImplementation(
    async () =>
      await Promise.resolve({
        status: 200,
        data: "test response",
      })
  );

  const groupCode = "123";
  const username = "test user";

  const response = await getGroup(groupCode, username);

  expect(response).toEqual("test response");
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith(ApiEndpoint.GROUP, {
    params: { groupCode, username },
  });
});

test("POST group to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const groupRequest: CreateGroupRequest = {
    groupCode: "123",
    username: "test user",
  };

  const response = await postCreateGroup(groupRequest);

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(ApiEndpoint.GROUP, groupRequest);
});
